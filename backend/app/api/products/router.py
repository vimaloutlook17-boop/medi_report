from fastapi import APIRouter
from .bulk_edit.router import router as bulk_edit_router

router = APIRouter()

router.include_router(bulk_edit_router, prefix="/bulk-edit", tags=["Products - Bulk Edit"])

