from fastapi import APIRouter
from .collection.router import router as collection_router
from .op_ip.router import router as op_ip_router
from .bill_wise_collection.router import router as bill_wise_collection_router

router = APIRouter()
router.include_router(collection_router, prefix="/collection", tags=["Reports - Collection"])
router.include_router(op_ip_router, prefix="/op-ip", tags=["Reports - OP/IP"])
router.include_router(bill_wise_collection_router, prefix="/bill-wise-collection", tags=["Reports - Bill Wise Collection"])
