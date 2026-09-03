from fastapi import APIRouter, Depends, HTTPException
from aiomysql import Connection
from app.database import get_db
from app.auth import verify_token
from .schemas import CollectionReportRequest, CustomerSearchRequest, UserSearchRequest
from .service import fetch_collection_report, search_customers, search_users

router = APIRouter()

@router.post("/")
async def get_collection_report(
    payload: CollectionReportRequest,
    shop_id: int = Depends(verify_token),
    db: Connection = Depends(get_db)
):
    try:
        result = await fetch_collection_report(
            conn=db,
            shop_id=shop_id,
            from_date=payload.from_date,
            to_date=payload.to_date,
            bill_no=payload.bill_no,
            customer_name=payload.customer_name,
            payment_mode=payload.payment_mode,
            created_by=payload.created_by
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search-users")
async def api_search_users(
    payload: UserSearchRequest,
    shop_id: int = Depends(verify_token),
    db: Connection = Depends(get_db)
):
    try:
        if len(payload.query) < 2:
            return {"data": []}
        results = await search_users(conn=db, shop_id=shop_id, query=payload.query)
        return {"data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search-customers")
async def api_search_customers(
    payload: CustomerSearchRequest,
    shop_id: int = Depends(verify_token),
    db: Connection = Depends(get_db)
):
    try:
        if len(payload.query) < 2:
            return {"data": []}
        results = await search_customers(conn=db, shop_id=shop_id, query=payload.query)
        return {"data": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
