from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from app.database import get_db
from aiomysql import Connection
from .service import fetch_product_summary
from app.auth import verify_token, create_access_token

router = APIRouter()

@router.get("/")
async def get_products_summary(
    product_id: str = Query(..., description="Product Item ID"),
    date_filter: Optional[str] = Query(None, description="Date filter"),
    from_date: Optional[str] = Query(None, description="Custom from date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="Custom to date (YYYY-MM-DD)"),
    page: int = Query(0, description="Page index (0-based)"),
    size: int = Query(10, description="Page size"),
    shop_id: int = Depends(verify_token),
    db: Connection = Depends(get_db)
):
    try:
        result = await fetch_product_summary(
            conn=db,
            shop_id=shop_id,
            product_id=product_id,
            date_filter=date_filter,
            from_date=from_date,
            to_date=to_date,
            size=size,
            page=page
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products")
async def get_products_dropdown(
    shop_id: int = Depends(verify_token),
    db: Connection = Depends(get_db)
):
    try:
        async with db.cursor() as cur:
            await cur.execute("SELECT id, name FROM item WHERE shop_id = %s ORDER BY name ASC", (shop_id,))
            items = await cur.fetchall()
            return items
    except Exception as e:
        return []

@router.get("/master-list")
async def get_master_list(
    page: int = Query(0, description="Page index"),
    size: int = Query(10, description="Page size"),
    search: Optional[str] = Query(None, description="Exact product name to filter"),
    shop_id: int = Depends(verify_token),
    db: Connection = Depends(get_db)
):
    offset = page * size
    try:
        async with db.cursor() as cur:
            if search:
                await cur.execute("SELECT COUNT(*) as total FROM item WHERE shop_id = %s AND name = %s", (shop_id, search))
            else:
                await cur.execute("SELECT COUNT(*) as total FROM item WHERE shop_id = %s", (shop_id,))
                
            count_row = await cur.fetchone()
            total = count_row['total'] if count_row else 0
            
            if size == -1:
                if search:
                    await cur.execute("""
                        SELECT i.id, i.name as product, IFNULL(SUM(b.totalqty), 0) as qty, i.status 
                        FROM item i 
                        LEFT JOIN batch_no b ON i.id = b.item_id AND b.shop_id = i.shop_id
                        WHERE i.shop_id = %s AND i.name = %s 
                        GROUP BY i.id 
                        ORDER BY i.name ASC
                    """, (shop_id, search))
                else:
                    await cur.execute("""
                        SELECT i.id, i.name as product, IFNULL(SUM(b.totalqty), 0) as qty, i.status 
                        FROM item i 
                        LEFT JOIN batch_no b ON i.id = b.item_id AND b.shop_id = i.shop_id
                        WHERE i.shop_id = %s 
                        GROUP BY i.id 
                        ORDER BY i.name ASC
                    """, (shop_id,))
            else:
                if search:
                    await cur.execute("""
                        SELECT i.id, i.name as product, IFNULL(SUM(b.totalqty), 0) as qty, i.status 
                        FROM item i 
                        LEFT JOIN batch_no b ON i.id = b.item_id AND b.shop_id = i.shop_id
                        WHERE i.shop_id = %s AND i.name = %s 
                        GROUP BY i.id 
                        ORDER BY i.name ASC 
                        LIMIT %s, %s
                    """, (shop_id, search, offset, size))
                else:
                    await cur.execute("""
                        SELECT i.id, i.name as product, IFNULL(SUM(b.totalqty), 0) as qty, i.status 
                        FROM item i 
                        LEFT JOIN batch_no b ON i.id = b.item_id AND b.shop_id = i.shop_id
                        WHERE i.shop_id = %s 
                        GROUP BY i.id 
                        ORDER BY i.name ASC 
                        LIMIT %s, %s
                    """, (shop_id, offset, size))
                    
            items = await cur.fetchall()
            
            return {"data": items, "total_count": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
