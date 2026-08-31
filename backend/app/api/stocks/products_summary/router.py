from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_products_summary():
    return [
        {"id": 1, "product": "ADENOSINE 6 MG", "qty": -10, "status": "ENABLED"},
        {"id": 2, "product": "AC NEW", "qty": -34, "status": "ENABLED"},
        {"id": 3, "product": "ULTAVIR 30ML", "qty": -21, "status": "ENABLED"},
        {"id": 4, "product": "ADRENALLINE", "qty": -5, "status": "ENABLED"},
        {"id": 5, "product": "RANTAC", "qty": -10, "status": "ENABLED"},
        {"id": 6, "product": "ANOZEST CREAM", "qty": -9, "status": "DISABLED"},
        {"id": 7, "product": "AZITHRO", "qty": -8, "status": "DISABLED"},
    ]
