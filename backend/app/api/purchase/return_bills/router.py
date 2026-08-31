from fastapi import APIRouter

router = APIRouter()

@router.get('/')
def get_return_bills():
    return {'message': 'Return Bills endpoint'}
