from fastapi import APIRouter, Depends, Query, Request
from typing import Optional
from pydantic import BaseModel
from app.auth import verify_token
from app.api.reports.op_ip.service import fetch_op_ip_report, search_patients, search_patients_by_id, search_patients_by_uhid

router = APIRouter()

class PatientSearchRequest(BaseModel):
    query: str

@router.post("/search-patients")
def api_search_patients(
    payload: PatientSearchRequest,
    shop_id: int = Depends(verify_token)
):
    results = search_patients(shop_id=shop_id, query=payload.query)
    return {"status": "success", "data": results}

@router.get("/search-patients")
def api_search_patients_get(
    query: str = Query(...),
    shop_id: int = Depends(verify_token)
):
    results = search_patients(shop_id=shop_id, query=query)
    return {"status": "success", "data": results}

@router.post("/search-patients-by-id")
def api_search_patients_by_id(
    payload: PatientSearchRequest,
    shop_id: int = Depends(verify_token)
):
    results = search_patients_by_id(shop_id=shop_id, query=payload.query)
    return {"status": "success", "data": results}

@router.get("/search-patients-by-id")
def api_search_patients_by_id_get(
    query: str = Query(...),
    shop_id: int = Depends(verify_token)
):
    results = search_patients_by_id(shop_id=shop_id, query=query)
    return {"status": "success", "data": results}

@router.post("/search-patients-by-uhid")
def api_search_patients_by_uhid(
    payload: PatientSearchRequest,
    shop_id: int = Depends(verify_token)
):
    results = search_patients_by_uhid(shop_id=shop_id, query=payload.query)
    return {"status": "success", "data": results}

@router.get("/search-patients-by-uhid")
def api_search_patients_by_uhid_get(
    query: str = Query(...),
    shop_id: int = Depends(verify_token)
):
    results = search_patients_by_uhid(shop_id=shop_id, query=query)
    return {"status": "success", "data": results}


@router.get("/list")
def get_op_ip_bill_list(
    request: Request,
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    search_uhid: Optional[str] = Query(None),
    search_patient_id: Optional[str] = Query(None),
    search_patient_name: Optional[str] = Query(None),
    page: int = Query(0),
    size: int = Query(10),
    shop_id: int = Depends(verify_token)
):
    branch_id = 0
    
    # If branch_id sent in query, we can handle it if needed
    query_branch = request.query_params.get("branch_id")
    if query_branch == "Head":
        branch_id = 0
    elif query_branch and query_branch != "0":
        try:
            branch_id = int(query_branch)
        except ValueError:
            pass

    data = fetch_op_ip_report(
        shop_id=shop_id,
        branch_id=branch_id,
        from_date=from_date,
        to_date=to_date,
        visit_type=type,
        search_uhid=search_uhid,
        search_patient_id=search_patient_id,
        search_patient_name=search_patient_name,
        page=page,
        size=size
    )
    
    return data
