from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional
from app.db import get_db_cursor
from app.auth import verify_token

router = APIRouter()

@router.get("/")
def get_product_wise_customer(
    item_id: Optional[int] = None,
    fdate: Optional[str] = None,
    tdate: Optional[str] = None,
    customer_name: Optional[str] = None,
    page: int = 0,
    size: int = 10,
    sort_field: Optional[str] = "created_at",
    sort_order: Optional[str] = "asc",
    shop_id: int = Depends(verify_token)
):
    """
    Get paginated bill details for a selected item/product (Product Wise Customer Report).
    Securely extracts shop_id from the verified JWT token.
    """
    effective_shop_id = shop_id
    offset = page * size
    
    def normalize_date(d_str: Optional[str]) -> Optional[str]:
        if not d_str:
            return None
        d_str = d_str.strip()
        if not d_str:
            return None
        if len(d_str) == 10 and d_str[4] == '-' and d_str[7] == '-':
            return d_str
        if '/' in d_str:
            parts = d_str.split('/')
            if len(parts) == 3:
                if len(parts[0]) == 4:
                    return f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
                elif len(parts[2]) == 4:
                    return f"{parts[2]}-{parts[0].zfill(2)}-{parts[1].zfill(2)}"
        return d_str

    fdate_norm = normalize_date(fdate)
    tdate_norm = normalize_date(tdate)

    # Build WHERE conditions
    where_clauses = [
        "bd.shop_id = %s",
        "bd.cust_id != 0"
    ]
    params = [effective_shop_id]
    qty_params = [effective_shop_id]

    if item_id:
        where_clauses.append("bd.item_id = %s")
        params.append(item_id)
        qty_params.append(item_id)

    if fdate_norm and tdate_norm:
        where_clauses.append("bd.bill_date >= %s")
        where_clauses.append("bd.bill_date < DATE_ADD(%s, INTERVAL 1 DAY)")
        params.extend([fdate_norm, tdate_norm])
        qty_params.extend([fdate_norm, tdate_norm])

    if customer_name and customer_name.strip():
        where_clauses.append("(c.customer_name LIKE %s OR c.phone LIKE %s)")
        search_pattern = f"%{customer_name.strip()}%"
        params.extend([search_pattern, search_pattern])
        qty_params.extend([search_pattern, search_pattern])

    where_sql = " AND ".join(where_clauses)

    # Sort mapping
    allowed_sort_fields = {
        "billNo": "bd.invoice_no",
        "invoice_no": "bd.invoice_no",
        "date": "bd.created_at",
        "created_at": "bd.created_at",
        "customerName": "customerName",
        "customer_name": "customerName",
        "qty": "qty",
        "final_qty": "qty",
        "batch": "bd.batchname",
        "batchname": "bd.batchname",
        "expDate": "bd.exp_date",
        "exp_date": "bd.exp_date"
    }
    order_col = allowed_sort_fields.get(sort_field, "bd.created_at")
    order_dir = "DESC" if str(sort_order).lower() == "desc" else "ASC"

    # Base query for rows
    sql = f"""
        SELECT 
            bd.invoice_no AS billNo, 
            IFNULL(DATE_FORMAT(bd.created_at, '%%d/%%m/%%Y'), '') AS date,
            IFNULL(DATE_FORMAT(bd.exp_date, '%%m/%%y'), '') AS expDate,
            bd.cust_id,
            COALESCE(c.customer_name, CONCAT('Customer #', bd.cust_id)) AS customerName,
            COALESCE(c.phone, '') AS mobile,
            bd.batchname AS batch,
            SUM(bd.final_qty) AS qty
        FROM bill_details bd 
        LEFT JOIN customer_details c ON bd.cust_id = c.cid
        WHERE {where_sql}
        GROUP BY bd.bill_id, bd.invoice_no, bd.created_at, bd.cust_id, c.customer_name, c.phone, bd.batchname, bd.exp_date
        ORDER BY {order_col} {order_dir}, bd.invoice_no ASC
    """

    # Query for grand total quantity
    qtysql = f"""
        SELECT COALESCE(SUM(bd.final_qty), 0) AS final_qty 
        FROM bill_details bd 
        LEFT JOIN customer_details c ON bd.cust_id = c.cid
        WHERE {where_sql}
    """

    try:
        with get_db_cursor() as cursor:
            # 1. Get total record count
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            total_count = len(rows)

            # 2. Get paginated slice
            paginated_sql = f"{sql} LIMIT %s, %s"
            cursor.execute(paginated_sql, params + [offset, size])
            paginated_rows = cursor.fetchall()

            # 3. Get total quantity
            cursor.execute(qtysql, qty_params)
            qty_res = cursor.fetchone()
            total_qty = int(qty_res.get('final_qty', 0)) if qty_res else 0

            return {
                "result": paginated_rows,
                "count": total_count,
                "totalqty": total_qty,
                "item_id": item_id,
                "shop_id": effective_shop_id
            }
    except Exception as e:
        print(f"Database error in get_product_wise_customer: {e}")
        return {
            "result": [],
            "count": 0,
            "totalqty": 0,
            "error": str(e)
        }


@router.get("/default-product")
def get_default_product(
    shop_id: int = Depends(verify_token)
):
    """
    Get top selling product for the logged-in shop to set initial dropdown selection.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT bd.item_id AS id, i.name, CONCAT(i.name, ' (ID: ', bd.item_id, ')') AS label
                FROM bill_details bd
                LEFT JOIN item i ON bd.item_id = i.id
                WHERE bd.shop_id = %s AND bd.cust_id != 0
                GROUP BY bd.item_id, i.name
                ORDER BY COUNT(*) DESC
                LIMIT 1
                """,
                [shop_id]
            )
            row = cursor.fetchone()
            if row and row.get('id'):
                return row
            
            cursor.execute(
                "SELECT id, name, CONCAT(name, ' (ID: ', id, ')') AS label FROM item WHERE shop_id = %s ORDER BY name ASC LIMIT 1",
                [shop_id]
            )
            row2 = cursor.fetchone()
            return row2 or {"id": None, "name": "", "label": ""}
    except Exception as e:
        print(f"Error fetching default product: {e}")
        return {"id": None, "name": "", "label": ""}


@router.get("/search-items")
def search_items(
    term: str = Query(..., min_length=2, description="Search term for products"),
    shop_id: int = Depends(verify_token)
):
    """
    Autocomplete search for medicines / products from item table for the authenticated shop.
    """
    search_pattern = f"%{term.strip()}%"
    
    sql = """
        SELECT id, name, CONCAT(name, ' (ID: ', id, ')') AS label
        FROM item
        WHERE shop_id = %s AND (name LIKE %s OR id LIKE %s)
        ORDER BY name ASC
        LIMIT 25
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(sql, [shop_id, search_pattern, search_pattern])
            return cursor.fetchall()
    except Exception as e:
        print(f"Error searching items: {e}")
        return []


@router.get("/search-patients")
def search_patients(
    term: str = Query(..., min_length=3, description="Search term for customers/patients"),
    shop_id: int = Depends(verify_token)
):
    """
    Autocomplete search for customers / patients from customer_details table for the authenticated shop.
    """
    search_pattern = f"%{term.strip()}%"
    
    sql = """
        SELECT cid AS id, customer_name AS name, phone AS mobile, CONCAT(customer_name, ' (', COALESCE(phone, ''), ')') AS label
        FROM customer_details
        WHERE shop_id = %s AND (customer_name LIKE %s OR phone LIKE %s)
        ORDER BY customer_name ASC
        LIMIT 25
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(sql, [shop_id, search_pattern, search_pattern])
            return cursor.fetchall()
    except Exception as e:
        print(f"Error searching patients: {e}")
        return []
