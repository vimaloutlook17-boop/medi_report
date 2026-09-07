from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from app.database import get_db
from aiomysql import Connection
from app.auth import verify_token

router = APIRouter()

@router.get("")
async def get_zero_stocks(
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
                search_condition = " AND i.name LIKE %s"
                params.append(f"%{search}%")
                count_params.append(f"%{search}%")

            # 1. Get total count for pagination
            count_sql = f"""
                SELECT COUNT(*) as count FROM (
                    SELECT i.id
                    FROM batch_no b
                    INNER JOIN item_temp i ON b.item_id = i.id
                    WHERE b.shop_id = %s {search_condition}
                    GROUP BY b.item_id, i.id
                    HAVING IFNULL(SUM(b.totalqty), 0) <= 0
                ) as temp
            """
            await cur.execute(count_sql, tuple(count_params))
            count_row = await cur.fetchone()
            total_count = count_row['count'] if count_row else 0

            # 2. Get the paginated data
            data_sql = f"""
                SELECT 
                    i.id, 
                    i.name as item, 
                    IFNULL(SUM(b.totalqty), 0) as stock
                FROM batch_no b
                INNER JOIN item_temp i ON b.item_id = i.id
                WHERE b.shop_id = %s {search_condition}
                GROUP BY b.item_id, i.id, i.name
                HAVING SUM(b.totalqty) <= 0
                ORDER BY i.name ASC
            """
            
            if size != -1:
                data_sql += " LIMIT %s, %s"
                params.extend([offset, size])
                
            await cur.execute(data_sql, tuple(params))
            data = await cur.fetchall()

            return {
                "data": data,
                "total_count": total_count
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
