from fastapi import APIRouter
from .product_wise_customer.router import router as product_wise_customer_router
from .product_wise_unique_customer.router import router as product_wise_unique_customer_router
from .customer_wise_product.router import router as customer_wise_product_router
from .customer_credit_reports.router import router as customer_credit_reports_router

router = APIRouter()

router.include_router(
    product_wise_customer_router, 
    prefix="/product-wise-customer", 
    tags=["Sales - Product Wise Customer"]
)

router.include_router(
    product_wise_unique_customer_router,
    prefix="/product-wise-unique-customer",
    tags=["Sales - Product Wise Unique Customer"]
)

router.include_router(
    customer_wise_product_router,
    prefix="/customer-wise-product",
    tags=["Sales - Customer Wise Product"]
)

router.include_router(
    customer_credit_reports_router,
    prefix="/customer-credit-reports",
    tags=["Sales - Customer Credit Reports"]
)


