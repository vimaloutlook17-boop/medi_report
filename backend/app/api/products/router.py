from fastapi import APIRouter
from .excel_export import router as excel_export_router

router = APIRouter()

router.include_router(excel_export_router, tags=["Products - Excel Export"])



