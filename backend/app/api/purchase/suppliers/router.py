from fastapi import APIRouter

router = APIRouter()

@router.get('/')
def get_suppliers():
    return {'message': 'Suppliers endpoint'}
