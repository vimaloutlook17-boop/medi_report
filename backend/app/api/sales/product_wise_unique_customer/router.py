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

def format_age(row: dict) -> str:
    age = row.get("age")
    age_type = (row.get("age_type") or "").strip()
    age_month = row.get("age_month")
    age_days = row.get("age_days")

    parts = []
    if age is not None and str(age).strip() and str(age) != "0":
        unit = age_type if age_type else "Y"
        parts.append(f"{age} {unit}".strip())
    if age_month is not None and str(age_month).strip() and str(age_month) != "0":
        parts.append(f"{age_month} M")
    if age_days is not None and str(age_days).strip() and str(age_days) != "0":
        parts.append(f"{age_days} D")

    if parts:
        return " ".join(parts)
    return str(age) if age is not None and str(age).strip() else ""

def format_address(row: dict) -> str:
    addr_parts = [
        (row.get("address_line_1") or "").strip(),
        (row.get("address_line_2") or "").strip(),
        (row.get("city") or "").strip(),
        (row.get("pincode") or "").strip(),
    ]
    clean_parts = [p for p in addr_parts if p]
    return ", ".join(clean_parts)


@router.get("/")
def get_product_wise_unique_customers(
    item_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    customer_name: Optional[str] = None,
    patient_name: Optional[str] = None,
    fdate: Optional[str] = None,
    tdate: Optional[str] = None,
    page: int = 0,
    size: int = 10,
    sort_field: Optional[str] = "customer_name",
    sort_order: Optional[str] = "asc",
    shop_id: int = Depends(verify_token)
):
    """
    Get paginated unique customers for a selected item/product (Product Wise Unique Customer Report).
    Securely extracts shop_id from the verified JWT token.
    """
    effective_shop_id = shop_id
    offset = page * size
    
    fdate_norm = normalize_date(fdate)
    tdate_norm = normalize_date(tdate)

    where_clauses = [
        "bd.cust_id != 0",
        "bd.shop_id = %s"
    ]
    params = [effective_shop_id]

    if item_id and int(item_id) != 0:
        where_clauses.append("bd.item_id = %s")
        params.append(item_id)

    if fdate_norm and tdate_norm:
        where_clauses.append("bd.bill_date >= %s")
        where_clauses.append("bd.bill_date < DATE_ADD(%s, INTERVAL 1 DAY)")
        params.extend([fdate_norm, tdate_norm])
    elif (fdate_norm and not tdate_norm) or (tdate_norm and not fdate_norm):
        return {"result": [], "count": 0, "item_id": item_id}

    if customer_id and int(customer_id) != 0:
        where_clauses.append("bd.cust_id = %s")
        params.append(customer_id)

    name_query = customer_name or patient_name
    if name_query and name_query.strip():
        where_clauses.append("(c.customer_name LIKE %s OR c.phone LIKE %s OR c.uhid_values LIKE %s OR c.customer_id LIKE %s)")
        search_pattern = f"%{name_query.strip()}%"
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

    where_sql = " AND ".join(where_clauses)

    allowed_sort_fields = {
        "uhid": "COALESCE(NULLIF(c.uhid_values, ''), NULLIF(c.customer_id, ''), c.cid)",
        "patientName": "c.customer_name",
        "customer_name": "c.customer_name",
        "customerName": "c.customer_name",
        "mobile": "c.phone",
        "phone": "c.phone",
        "age": "c.age",
        "address": "c.city",
        "first_purchase_date": "first_purchase_date"
    }
    order_col = allowed_sort_fields.get(sort_field, "c.customer_name")
    order_dir = "DESC" if str(sort_order).lower() == "desc" else "ASC"

    base_sql = f"""
        SELECT
            c.cid,
            c.customer_id,
            c.uhid_values,
            c.customer_name,
            c.phone,
            c.age,
            c.age_type,
            c.age_month,
            c.age_days,
            c.address_line_1,
            c.address_line_2,
            c.city,
            c.pincode,
            MIN(bd.created_at) AS first_purchase_date
        FROM bill_details bd
        INNER JOIN customer_details c ON c.cid = bd.cust_id
            AND (c.shop_id = bd.shop_id OR c.lab_id = bd.shop_id)
        WHERE {where_sql}
        GROUP BY c.cid, c.customer_id, c.uhid_values, c.customer_name, c.phone, c.age, c.age_type, c.age_month, c.age_days, c.address_line_1, c.address_line_2, c.city, c.pincode
        ORDER BY {order_col} {order_dir}
    """

    try:
        with get_db_cursor() as cursor:
            # 1. Total record count
            cursor.execute(base_sql, params)
            all_rows = cursor.fetchall()
            total_count = len(all_rows)

            # 2. Paginated rows
            paginated_sql = f"{base_sql} LIMIT %s, %s"
            cursor.execute(paginated_sql, params + [offset, size])
            raw_rows = cursor.fetchall()

            # Format the output for the UI
            formatted_result = []
            for row in raw_rows:
                uhid = row.get("uhid_values") or row.get("customer_id") or str(row.get("cid") or "")
                patient_name = row.get("customer_name") or f"Customer #{row.get('cid')}"
                mobile = row.get("phone") or ""
                age_formatted = format_age(row)
                address_formatted = format_address(row)

                formatted_result.append({
                    "cid": row.get("cid"),
                    "uhid": uhid,
                    "customer_id": row.get("customer_id"),
                    "uhid_values": row.get("uhid_values"),
                    "patientName": patient_name,
                    "customerName": patient_name,
                    "mobile": mobile,
                    "phone": mobile,
                    "age": age_formatted,
                    "address": address_formatted,
                    "address_line_1": row.get("address_line_1") or "",
                    "address_line_2": row.get("address_line_2") or "",
                    "city": row.get("city") or "",
                    "pincode": row.get("pincode") or "",
                    "first_purchase_date": str(row.get("first_purchase_date") or "")
                })

            return {
                "result": formatted_result,
                "count": total_count,
                "item_id": item_id,
                "shop_id": effective_shop_id
            }
    except Exception as e:
        print(f"Database error in get_product_wise_unique_customers: {e}")
        return {
            "result": [],
            "count": 0,
            "item_id": item_id,
            "error": str(e)
        }


@router.get("/default-product")
def get_default_product(
    shop_id: int = Depends(verify_token)
):
    """
    Get top selling product for the logged-in shop to set initial dropdown selection.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT bd.item_id AS id, i.name, CONCAT(i.name, ' (ID: ', bd.item_id, ')') AS label
                FROM bill_details bd
                LEFT JOIN item i ON bd.item_id = i.id
                WHERE bd.shop_id = %s AND bd.cust_id != 0
                GROUP BY bd.item_id, i.name
                ORDER BY COUNT(*) DESC
                LIMIT 1
                """,
                [shop_id]
            )
            row = cursor.fetchone()
            if row and row.get('id'):
                return row
            
            cursor.execute(
                "SELECT id, name, CONCAT(name, ' (ID: ', id, ')') AS label FROM item WHERE shop_id = %s ORDER BY name ASC LIMIT 1",
                [shop_id]
            )
            row2 = cursor.fetchone()
            return row2 or {"id": None, "name": "", "label": ""}
    except Exception as e:
        print(f"Error fetching default product: {e}")
        return {"id": None, "name": "", "label": ""}


@router.get("/search-items")
def search_items(
    term: str = Query(..., min_length=2, description="Search term for products"),
    shop_id: int = Depends(verify_token)
):
    """
    Autocomplete search for medicines / products from item table for the authenticated shop.
    """
    search_pattern = f"%{term.strip()}%"
    sql = """
        SELECT id, name, CONCAT(name, ' (ID: ', id, ')') AS label
        FROM item
        WHERE shop_id = %s AND (name LIKE %s OR id LIKE %s)
        ORDER BY name ASC
        LIMIT 25
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(sql, [shop_id, search_pattern, search_pattern])
            return cursor.fetchall()
    except Exception as e:
        print(f"Error searching items: {e}")
        return []


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
