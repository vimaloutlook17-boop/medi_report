from fastapi import APIRouter
from .product_wise_customer.router import router as product_wise_customer_router

router = APIRouter()

router.include_router(
    product_wise_customer_router, 
    prefix="/product-wise-customer", 
    tags=["Sales - Product Wise Customer"]
)
