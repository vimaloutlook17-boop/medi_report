from pydantic import BaseModel
from typing import Optional

class CollectionReportRequest(BaseModel):
    shop_id: Optional[str] = None
    bill_no: Optional[str] = None
    customer_name: Optional[str] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None
    payment_mode: Optional[str] = None
    created_by: Optional[str] = None

class CustomerSearchRequest(BaseModel):
    query: str

class UserSearchRequest(BaseModel):
    query: str
