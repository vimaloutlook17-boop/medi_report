from fastapi import APIRouter

from .orders.router import router as orders_router
from .imports.router import router as imports_router
from .return_bills.router import router as return_bills_router
from .suppliers.router import router as suppliers_router
# ... include others here ...

router = APIRouter()

# Register sub-routers under the main purchase route
router.include_router(orders_router, prefix="/orders", tags=["Purchase - Orders"])
router.include_router(imports_router, prefix="/imports", tags=["Purchase - Imports"])
router.include_router(return_bills_router, prefix="/return-bills", tags=["Purchase - Return Bills"])
router.include_router(suppliers_router, prefix="/suppliers", tags=["Purchase - Suppliers"])
