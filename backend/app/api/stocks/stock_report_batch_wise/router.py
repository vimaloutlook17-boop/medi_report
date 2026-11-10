from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from app.database import get_db
from aiomysql import Connection
from app.auth import verify_token

router = APIRouter()

@router.get("")
async def get_batch_wise_report(
    page: int = Query(0, description="Page index"),
    size: int = Query(10, description="Page size"),
    search: Optional[str] = Query(None, description="Search term for item name"),
    shop_id: int = Depends(verify_token),
    db: Connection = Depends(get_db)
):
    offset = page * size
    try:
        async with db.cursor() as cur:
            search_condition = ""
            params = [shop_id]
            count_params = [shop_id]
            
            if search:
                search_condition = " AND item_temp.name LIKE %s"
                params.append(f"%{search}%")
                count_params.append(f"%{search}%")

            count_sql = f"""
                SELECT COUNT(*) AS count
                FROM (
                    SELECT batch_no.item_id, batch_no.batch_item
                    FROM batch_no
                    INNER JOIN item_temp ON item_temp.id = batch_no.item_id
                    WHERE batch_no.totalqty > 0 
                      AND batch_no.shop_id = %s 
                      AND item_temp.is_delete = 'no' 
                      {search_condition}
                    GROUP BY batch_no.item_id, batch_no.batch_item 
                ) x
            """
            await cur.execute(count_sql, tuple(count_params))
            count_row = await cur.fetchone()
            total = count_row['count'] if count_row else 0

            data_sql = f"""
                SELECT
                    item_temp.name AS item_name,
                    batch_no.batch_item,
                    batch_no.totalqty,
                    batch_no.mrp,
                    batch_no.cost,
                    batch_no.costprice_per_tablet,
                    batch_no.tab_price
                FROM batch_no
                INNER JOIN item_temp ON item_temp.id = batch_no.item_id
                WHERE batch_no.totalqty > 0 
                  AND batch_no.shop_id = %s 
                  AND item_temp.is_delete = 'no' 
                  {search_condition}
                GROUP BY batch_no.item_id, batch_no.batch_item, item_temp.name, batch_no.totalqty, batch_no.mrp, batch_no.cost, batch_no.costprice_per_tablet, batch_no.tab_price
                ORDER BY item_temp.name ASC
            """

            if size != -1:
                data_sql += " LIMIT %s, %s"
                params.extend([offset, size])

            await cur.execute(data_sql, tuple(params))
            data = await cur.fetchall()

            return {"data": data, "total_count": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
