from fastapi import APIRouter

router = APIRouter()

@router.get('/')
def get_save_later():
    return {'message': 'Save Later endpoint'}
