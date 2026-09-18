from fastapi import APIRouter
from .bulk_edit.router import router as bulk_edit_router
from .excel_export import router as excel_export_router

router = APIRouter()

router.include_router(bulk_edit_router, prefix="/bulk-edit", tags=["Products - Bulk Edit"])
router.include_router(excel_export_router, tags=["Products - Excel Export"])


