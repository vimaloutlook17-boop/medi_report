from fastapi import APIRouter, Depends, HTTPException
from aiomysql import Connection
from typing import Optional
from pydantic import BaseModel
import traceback
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import csv
import io

from app.database import get_db
from app.auth import verify_token
from .service import fetch_bill_wise_collection_report, search_bills, search_customers

router = APIRouter()

class BillSearchRequest(BaseModel):
    query: str

class CustomerSearchRequest(BaseModel):
    query: str

@router.post("/search-bills")
async def api_search_bills(
    payload: BillSearchRequest,
    conn: Connection = Depends(get_db),
    shop_id: int = Depends(verify_token)
):
    try:
        results = await search_bills(conn=conn, shop_id=shop_id, query=payload.query)
        return {"status": "success", "data": results}
    except Exception as e:
        print("Error searching bills:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/search-customers")
async def api_search_customers(
    payload: CustomerSearchRequest,
    conn: Connection = Depends(get_db),
    shop_id: int = Depends(verify_token)
):
    try:
        results = await search_customers(conn=conn, shop_id=shop_id, query=payload.query)
        return {"status": "success", "data": results}
    except Exception as e:
        print("Error searching customers:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")

class SendMailRequest(BaseModel):
    to_email: str
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    bill_no: Optional[str] = None
    customer_name: Optional[str] = None
    status: Optional[str] = None
    branch_id: int = 0

from .email_service import send_bill_wise_collection_email

@router.post("/send-mail")
async def send_mail(
    payload: SendMailRequest,
    conn: Connection = Depends(get_db),
    shop_id: int = Depends(verify_token)
):
    try:
        report_result = await fetch_bill_wise_collection_report(
            conn=conn, shop_id=shop_id,
            from_date=payload.from_date, to_date=payload.to_date,
            bill_no=payload.bill_no, customer_name=payload.customer_name,
            status=payload.status, branch_id=payload.branch_id
        )
        rows = report_result.get('data', [])
        totals = report_result.get('totals', {})
        mode_payments = report_result.get('mode_payments', [])

        email_result = send_bill_wise_collection_email(
            to_email=payload.to_email,
            rows=rows,
            totals=totals,
            mode_payments=mode_payments,
            from_date=payload.from_date,
            to_date=payload.to_date
        )
        return email_result
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class BillWiseCollectionFilter(BaseModel):
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    bill_no: Optional[str] = None
    customer_name: Optional[str] = None
    status: Optional[str] = None
    branch_id: int = 0

@router.post("/")
async def get_bill_wise_collection_report(
    filters: BillWiseCollectionFilter,
    conn: Connection = Depends(get_db),
    shop_id: int = Depends(verify_token)
):
    try:
            
        result = await fetch_bill_wise_collection_report(
            conn=conn,
            shop_id=shop_id,
            from_date=filters.from_date,
            to_date=filters.to_date,
            bill_no=filters.bill_no,
            customer_name=filters.customer_name,
            status=filters.status,
            branch_id=filters.branch_id
        )
        return {"status": "success", "data": result}
    except Exception as e:
        print("Error fetching bill wise collection report:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
