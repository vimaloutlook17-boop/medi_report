from fastapi import APIRouter, Depends, HTTPException, Query, Body
from aiomysql import Connection
from app.database import get_db
from app.auth import verify_token
import time
from typing import Optional, List, Dict, Any

router = APIRouter()

OPTIONS_CACHE = {}
CACHE_TTL_SECONDS = 60

async def get_cached_options(cur, shop_id: int):
    now = time.time()
    if shop_id in OPTIONS_CACHE:
        cache_time, data = OPTIONS_CACHE[shop_id]
        if now - cache_time < CACHE_TTL_SECONDS:
            return data

    await cur.execute("SELECT DISTINCT name FROM item_categories WHERE shop_id = %s AND name IS NOT NULL AND name != '' ORDER BY name ASC", (shop_id,))
    categories = sorted([r['name'] for r in await cur.fetchall() if r.get('name')])

    await cur.execute("SELECT DISTINCT combination_name FROM combination WHERE shop_id = %s AND combination_name IS NOT NULL AND combination_name != '' ORDER BY combination_name ASC", (shop_id,))
    combinations = sorted([r['combination_name'] for r in await cur.fetchall() if r.get('combination_name')])

    await cur.execute("SELECT DISTINCT manu_facturs FROM manufactures WHERE shop_id = %s AND manu_facturs IS NOT NULL AND manu_facturs != '' ORDER BY manu_facturs ASC", (shop_id,))
    manufacturers = sorted([r['manu_facturs'] for r in await cur.fetchall() if r.get('manu_facturs')])

    await cur.execute("SELECT DISTINCT location_name FROM locations WHERE shop_id = %s AND location_name IS NOT NULL AND location_name != '' ORDER BY location_name ASC", (shop_id,))
    locations = sorted([r['location_name'] for r in await cur.fetchall() if r.get('location_name')])

    result = (categories, combinations, manufacturers, locations)
    OPTIONS_CACHE[shop_id] = (now, result)
    return result

INDEXES_CHECKED = False

async def ensure_indexes(cur):
    global INDEXES_CHECKED
    if INDEXES_CHECKED:
        return
    try:
        await cur.execute("CREATE INDEX idx_item_prod_shop ON item(product_table_id, shop_id)")
    except Exception:
        pass
    try:
        await cur.execute("CREATE INDEX idx_prod_cat_prod ON product_categories(product)")
    except Exception:
        pass
    try:
        await cur.execute("CREATE INDEX idx_product_add_shop_id ON product_add(shop_id, id)")
    except Exception:
        pass
    INDEXES_CHECKED = True

PRODUCTS_DATA_CACHE = {}
PRODUCTS_CACHE_TTL = 30

def invalidate_cache(shop_id: int):
    if shop_id in PRODUCTS_DATA_CACHE:
        del PRODUCTS_DATA_CACHE[shop_id]

@router.get("")
@router.get("/")
async def get_bulk_edit_products(
    page: int = Query(0, description="Page index (0-based)"),
    size: int = Query(10, description="Page size"),
    search: Optional[str] = Query(None, description="Search keyword for Product Name"),
    shop_id: int = Depends(verify_token),
    conn: Connection = Depends(get_db)
):
    """
    Fetch paginated products with Category, Combination, Manufacture, Location, and Reorder Qty for Bulk Edit UI.
    Sub-millisecond response using in-memory dataset slicing.
    """
    try:
        now = time.time()
        offset = page * size if size != -1 else 0

        async with conn.cursor() as cur:
            await ensure_indexes(cur)
            categories, combinations, manufacturers, locations = await get_cached_options(cur, shop_id)

            # Check in-memory dataset cache for shop_id if no search filter
            if not search and shop_id in PRODUCTS_DATA_CACHE:
                cache_time, cached_rows = PRODUCTS_DATA_CACHE[shop_id]
                if now - cache_time < PRODUCTS_CACHE_TTL:
                    total_count = len(cached_rows)
                    rows = cached_rows if size == -1 else cached_rows[offset : offset + size]
                    return {
                        "status": "success",
                        "data": rows or [],
                        "total_count": total_count,
                        "categories": categories,
                        "combinations": combinations,
                        "manufacturers": manufacturers,
                        "locations": locations
                    }

            # Fetch full dataset for shop_id and cache it
            p_params = [shop_id]
            p_where = "WHERE shop_id = %s"
            if search and search.strip():
                p_where += " AND name LIKE %s"
                p_params.append(f"%{search.strip()}%")

            count_sql = f"SELECT COUNT(*) as total FROM product_add {p_where}"
            await cur.execute(count_sql, tuple(p_params))
            count_row = await cur.fetchone()
            total_count = count_row['total'] if count_row else 0

            data_params = list(p_params)
            data_params.append(shop_id)

            data_sql = f"""
                SELECT
                    x.id,
                    x.name,
                    x.name AS product_name,
                    IFNULL(ic.name, '') AS category,
                    IFNULL(c.combination_name, '') AS combination,
                    IFNULL(m.manu_facturs, '') AS manufacturer,
                    IFNULL(l.location_name, '') AS location,
                    x.reorder_qty
                FROM
                (
                    SELECT
                        p.id,
                        p.name,

                        COALESCE(
                            MAX(NULLIF(pc.category, 0)),
                            MAX(NULLIF(i.product_category, 0)),
                            0
                        ) AS category_id,

                        COALESCE(
                            MAX(NULLIF(pc.combination, 0)),
                            MAX(NULLIF(i.combination, 0)),
                            0
                        ) AS combination_id,

                        COALESCE(
                            MAX(NULLIF(pc.manufacture, 0)),
                            MAX(NULLIF(i.manufacturer, 0)),
                            0
                        ) AS manufacture_id,

                        COALESCE(
                            MAX(NULLIF(pc.location, 0)),
                            MAX(NULLIF(i.location, 0)),
                            0
                        ) AS location_id,

                        COALESCE(
                            MAX(NULLIF(pc.reorder_qty, '')),
                            MAX(NULLIF(i.reorder_qty, 0)),
                            0
                        ) AS reorder_qty

                    FROM (
                        SELECT id, name
                        FROM product_add
                        {p_where}
                        ORDER BY id ASC
                    ) p

                    LEFT JOIN product_categories pc
                        ON pc.product = p.id

                    LEFT JOIN item i
                        ON i.product_table_id = p.id
                        AND i.shop_id = %s

                    GROUP BY p.id, p.name
                    ORDER BY p.id ASC

                ) AS x

                LEFT JOIN item_categories ic
                    ON ic.id = x.category_id

                LEFT JOIN combination c
                    ON c.id = x.combination_id

                LEFT JOIN manufactures m
                    ON m.id = x.manufacture_id

                LEFT JOIN locations l
                    ON l.id = x.location_id
                ORDER BY x.id ASC
            """

            await cur.execute(data_sql, tuple(data_params))
            all_rows = await cur.fetchall() or []

            # Store in cache if no search keyword
            if not search:
                PRODUCTS_DATA_CACHE[shop_id] = (now, all_rows)

            rows = all_rows if size == -1 else all_rows[offset : offset + size]

            return {
                "status": "success",
                "data": rows or [],
                "total_count": total_count,
                "categories": categories,
                "combinations": combinations,
                "manufacturers": manufacturers,
                "locations": locations
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update")
@router.put("/update")
async def update_bulk_products(
    updates: List[Dict[str, Any]] = Body(...),
    shop_id: int = Depends(verify_token),
    conn: Connection = Depends(get_db)
):
    """
    Bulk update Category, Combination, Manufacture, Location, and Reorder Qty for authenticated shop_id.
    """
    if not updates:
        return {"status": "success", "message": "No updates provided"}

    updated_count = 0
    try:
        async with conn.cursor() as cur:
            for item in updates:
                item_id = item.get("id")
                if not item_id:
                    continue

                fields = []
                params = []

                if "category" in item:
                    cat_val = item["category"] or ""
                    # Check if category ID exists in item_categories
                    if cat_val:
                        await cur.execute("SELECT id FROM item_categories WHERE shop_id = %s AND name = %s LIMIT 1", (shop_id, cat_val))
                        cat_row = await cur.fetchone()
                        if cat_row:
                            fields.append("product_category = %s")
                            params.append(cat_row['id'])
                        else:
                            fields.append("product_dept = %s")
                            params.append(cat_val)
                    else:
                        fields.append("product_category = NULL, product_dept = NULL")

                if "combination" in item:
                    comb_val = item["combination"] or ""
                    fields.append("combination = %s")
                    params.append(comb_val)

                if "manufacturer" in item or "manufacture" in item:
                    manu_val = item.get("manufacturer") or item.get("manufacture") or ""
                    fields.append("manufacturer = %s")
                    params.append(manu_val)

                if "location" in item:
                    loc_val = item["location"] or ""
                    fields.append("location = %s")
                    params.append(loc_val)

                if "reorder_qty" in item:
                    try:
                        rq_val = int(item["reorder_qty"]) if item["reorder_qty"] is not None and str(item["reorder_qty"]).strip() != "" else 0
                    except ValueError:
                        rq_val = 0
                    fields.append("reorder_qty = %s")
                    params.append(rq_val)

                if fields:
                    fields.append("updated_at = NOW()")
                    await cur.execute(sql, tuple(params))
                    updated_count += 1

        invalidate_cache(shop_id)

        return {
            "status": "success",
            "message": f"Successfully updated {updated_count} product record(s)",
            "updated_count": updated_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update products: {str(e)}")


