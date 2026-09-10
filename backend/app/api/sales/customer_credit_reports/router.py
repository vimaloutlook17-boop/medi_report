from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional
from app.db import get_db_cursor
from app.auth import verify_token

router = APIRouter()

def normalize_date(d_str: Optional[str]) -> Optional[str]:
    if not d_str:
        return None
    d_str = d_str.strip()
    if not d_str:
        return None
    if len(d_str) == 10 and d_str[4] == '-' and d_str[7] == '-':
        return d_str
    if '/' in d_str:
        parts = d_str.split('/')
        if len(parts) == 3:
            if len(parts[0]) == 4:
                return f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
            elif len(parts[2]) == 4:
                return f"{parts[2]}-{parts[0].zfill(2)}-{parts[1].zfill(2)}"
    return d_str


@router.get("/")
def get_customer_credit_reports(
    customer_id: Optional[int] = None,
    customer_name: Optional[str] = None,
    patient_name: Optional[str] = None,
    fdate: Optional[str] = None,
    tdate: Optional[str] = None,
    page: int = 0,
    size: int = 10,
    sort_field: Optional[str] = "bill_date",
    sort_order: Optional[str] = "desc",
    shop_id: int = Depends(verify_token)
):
    """
    Get customer credit reports (Customer Credit List).
    Queries bill (a) joined with customer_details (b) where balance != 0 and shop_id matches.
    """
    effective_shop_id = shop_id
    offset = page * size
    
    fdate_norm = normalize_date(fdate)
    tdate_norm = normalize_date(tdate)

    where_clauses = [
        "a.shop_id = %s",
        "a.balance != 0"
    ]
    params = [effective_shop_id]
    summary_params = [effective_shop_id]

    # Filter by specific customer ID or customer/patient name
    name_query = customer_name or patient_name
    if customer_id and int(customer_id) != 0:
        where_clauses.append("a.cust_id = %s")
        params.append(customer_id)
        summary_params.append(customer_id)
    elif name_query and name_query.strip():
        where_clauses.append("(b.customer_name LIKE %s OR b.phone LIKE %s)")
        search_pattern = f"%{name_query.strip()}%"
        params.extend([search_pattern, search_pattern])
        summary_params.extend([search_pattern, search_pattern])

    # Date range filters
    if fdate_norm:
        where_clauses.append("DATE(a.bill_date) >= %s")
        params.append(fdate_norm)
        summary_params.append(fdate_norm)

    if tdate_norm:
        where_clauses.append("DATE(a.bill_date) <= %s")
        params.append(tdate_norm)
        summary_params.append(tdate_norm)

    where_sql = " AND ".join(where_clauses)

    allowed_sort_fields = {
        "customer_name": "b.customer_name",
        "patientName": "b.customer_name",
        "customerName": "b.customer_name",
        "bill_no": "a.invoice_no",
        "billNo": "a.invoice_no",
        "invoice_no": "a.invoice_no",
        "bill_date": "a.bill_date",
        "billDate": "a.bill_date",
        "bill_amount": "a.grand_total",
        "billAmount": "a.grand_total",
        "grand_total": "a.grand_total",
        "balance": "a.balance",
        "due_date": "a.due_date",
        "dueDate": "a.due_date",
        "count": "a.credit_days",
        "credit_days": "a.credit_days"
    }
    order_col = allowed_sort_fields.get(sort_field, "a.bill_date")
    order_dir = "DESC" if str(sort_order).lower() == "desc" else "ASC"

    # Base query for rows
    sql = f"""
        SELECT 
            b.customer_name AS customer_name,
            b.customer_name AS patientName,
            b.customer_name AS customerName,
            a.return_item_amount AS return_item_amount,
            a.invoice_no AS invoice_no,
            a.invoice_no AS billNo,
            IFNULL(DATE_FORMAT(a.bill_date, '%%d/%%m/%%Y'), '') AS billDate,
            a.bill_date AS bill_date,
            a.grand_total AS grand_total,
            a.grand_total AS billAmount,
            a.balance AS balance,
            IFNULL(DATE_FORMAT(a.due_date, '%%d/%%m/%%Y'), '') AS dueDate,
            a.due_date AS due_date,
            a.credit_days AS credit_days,
            DATEDIFF(a.due_date, CURDATE()) AS count
        FROM bill a 
        JOIN customer_details b ON a.cust_id = b.cid 
        WHERE {where_sql}
        GROUP BY a.bill_id, a.invoice_no, b.customer_name, a.return_item_amount, a.bill_date, a.grand_total, a.balance, a.due_date, a.credit_days
        ORDER BY {order_col} {order_dir}, a.invoice_no ASC
    """

    # Query for grand totals
    summary_sql = f"""
        SELECT 
            COALESCE(SUM(a.grand_total), 0) AS total_bill_amount,
            COALESCE(SUM(a.balance), 0) AS total_balance
        FROM bill a 
        JOIN customer_details b ON a.cust_id = b.cid 
        WHERE {where_sql}
    """

    try:
        with get_db_cursor() as cursor:
            # 1. Total record count
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            total_count = len(rows)

            # 2. Paginated rows
            paginated_sql = f"{sql} LIMIT %s, %s"
            cursor.execute(paginated_sql, params + [offset, size])
            paginated_rows = cursor.fetchall()

            # 3. Total amounts
            cursor.execute(summary_sql, summary_params)
            summary_res = cursor.fetchone()
            total_bill_amount = float(summary_res.get('total_bill_amount', 0)) if summary_res else 0.0
            total_balance = float(summary_res.get('total_balance', 0)) if summary_res else 0.0

            return {
                "result": paginated_rows,
                "count": total_count,
                "total_bill_amount": total_bill_amount,
                "total_amount": total_bill_amount,
                "total_balance": total_balance,
                "customer_id": customer_id,
                "shop_id": effective_shop_id
            }
    except Exception as e:
        print(f"Database error in get_customer_credit_reports: {e}")
        return {
            "result": [],
            "count": 0,
            "total_bill_amount": 0.0,
            "total_amount": 0.0,
            "total_balance": 0.0,
            "error": str(e)
        }


@router.get("/search-patients")
def search_patients(
    term: str = Query(..., min_length=3, description="Search term for customers/patients"),
    shop_id: int = Depends(verify_token)
):
    """
    Autocomplete search for customers / patients from customer_details table for the authenticated shop.
    """
    search_pattern = f"%{term.strip()}%"
    sql = """
        SELECT cid AS id, customer_name AS name, phone AS mobile, CONCAT(customer_name, ' (', COALESCE(phone, ''), ')') AS label
        FROM customer_details
        WHERE shop_id = %s AND (customer_name LIKE %s OR phone LIKE %s)
        ORDER BY customer_name ASC
        LIMIT 25
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(sql, [shop_id, search_pattern, search_pattern])
            return cursor.fetchall()
    except Exception as e:
        print(f"Error searching patients: {e}")
        return []
