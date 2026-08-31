from fastapi import APIRouter
from .products_summary.router import router as products_summary_router

router = APIRouter()
router.include_router(products_summary_router, prefix="/products-summary", tags=["Stocks - Products Summary"])
