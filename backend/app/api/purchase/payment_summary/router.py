from fastapi import APIRouter

router = APIRouter()

@router.get('/')
def get_payment_summary():
    return {'message': 'Payment Summary endpoint'}
