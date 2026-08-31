from fastapi import APIRouter

router = APIRouter()

@router.get('/')
def get_imports():
    return {'message': 'Imports endpoint'}
