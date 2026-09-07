from fastapi import APIRouter
from .products_summary.router import router as products_summary_router
from .stock_report_batch_wise.router import router as batch_wise_router
from .zero_stocks.router import router as zero_stocks_router

router = APIRouter()
router.include_router(products_summary_router, prefix="/products-summary", tags=["Stocks - Products Summary"])
router.include_router(batch_wise_router, prefix="/stock-report-batch-wise", tags=["Stocks - Batch Wise Report"])
router.include_router(zero_stocks_router, prefix="/zero-stocks", tags=["Stocks - Zero Stocks Report"])
