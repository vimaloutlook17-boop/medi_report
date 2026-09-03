from fastapi import APIRouter
from .collection.router import router as collection_router

router = APIRouter()
router.include_router(collection_router, prefix="/collection", tags=["Reports - Collection"])
