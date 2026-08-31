from fastapi import APIRouter

router = APIRouter()

@router.get('/')
def get_suppliers_credit_reports():
    return {'message': 'Suppliers Credit Reports endpoint'}
