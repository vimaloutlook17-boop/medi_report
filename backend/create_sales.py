import os

sales_code = r"""from fastapi import APIRouter, Query
from typing import Optional
from app.db import get_db_cursor
from datetime import datetime, date
from decimal import Decimal

router = APIRouter()

def serialize_row(row):
    formatted = {}
    for key, val in row.items():
        if isinstance(val, (datetime, date)):
            formatted[key] = val.strftime('%d/%m/%Y') if hasattr(val, 'strftime') else str(val)
        elif isinstance(val, Decimal):
            formatted[key] = int(val) if val % 1 == 0 else float(val)
        else:
            formatted[key] = val if val is not None else ''
    return formatted

@router.get('/items')
def get_items(
    term: str = Query('', description='Search term for item name'),
    shop_id: Optional[int] = Query(None)
):
    with get_db_cursor() as cursor:
        params = []
        sql = "SELECT id, name FROM item WHERE is_delete = 'no'"
        if shop_id:
            sql += ' AND shop_id = %s'
            params.append(shop_id)
        if term:
            sql += ' AND name LIKE %s'
            params.append(f'%{term}%')
        sql += ' ORDER BY name ASC LIMIT 50'
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        return [{'id': r['id'], 'label': r['name'], 'value': r['id']} for r in rows]

@router.get('/patients')
def get_patients(
    term: str = Query('', description='Search term for patient name or mobile'),
    shop_id: Optional[int] = Query(None)
):
    with get_db_cursor() as cursor:
        params = []
        sql = "SELECT cid, customer_name, phone FROM customer_details WHERE (customer_name != '' OR phone != '')"
        if shop_id:
            sql += ' AND shop_id = %s'
            params.append(shop_id)
        if term:
            sql += ' AND (customer_name LIKE %s OR phone LIKE %s)'
            params.extend([f'%{term}%', f'%+term}%'])
        sql += ' ORDER BY customer_name ASC LIMIT 50'
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        return [
            {
                'id': r['cid'],
                'label': f'{r['customer_name']} ({r['phone']})' if r.get('phone') else r['customer_name'],
                'name': r['customer_name'],
                'phone': r.get('phone', ''),
                'value': r['cid']
            }
            for r in rows
        ]

@router.get('/')
def get_product_wise_customer_list(
    item_id: Optional[int] = Query(None, description='Item ID'),
    patient_name: Optional[str] = Query(None, description='Filter by patient name or phone'),
    fdate: Optional[str] = Query(None, description='From date YYYY-MM-DD'),
    tdate: Optional[str] = Query(None, description='Todate YYYY-MM-DD'),
    page: int = Query(0, ge=0, description='Page number 0-indexed'),
    size: int = Query(10, ge=1, le=500, description='Page size'),
    shop_id: Optional[int] = Query(None, description='Shop ID')
):
    fdate = fdate.strip() if fdate else ''
    tdate = tdate.strip() if tdate else ''
    offset = page * size

    if not item_id and not fdate and not tdate:
        return {'result': [], 'count': 0, 'totalqty': 0}

    where_clauses = ['bd.cust_id != 0']
    params = []

    if item_id:
        where_clauses.append('bd.item_id = %s')
        params.append(item_id)

    if shop_id:
        where_clauses.append('bd.shop_id = %s')
        params.append(shop_id)

    if fdate and tdate:
        where_clauses.append('bd.bill_date >= %s AND bd.bill_date < DATE_ADD(%s, INTERVAL 1 DAY)')
        params.extend([fdate, tdate])
    elif fdate:
        where_clauses.append('bd.bill_date >= %s')
        params.append(fdate)
    elif tdate:
        where_clauses.append('bd.bill_date < DATE_ADD(%s, INTERVAL 1 DAY)')
        params.append(tdate)

    if patient_name:
        where_clauses.append('(cd.customer_name LIKE %s OR cd.phone LIKE %s)')
        params.extend([f'%+patient_name}%', f'%+patient_name}%'])

    where_sql = ' AND '.join(where_clauses)

    base_sql = f'''SELECT 
            bd.invoice_no AS billNo, 
            bd.created_at AS date,
            bd.exp_date AS expDate,
            bd.cust_id,
            cd.customer_name AS customerName,
            cd.phone AS mobile,
            bd.batchname AS batch,
            SUM(bd.final_qty) AS qty
        FROM bill_details bd 
        LEFT JOIN customer_details cd ON bd.cust_id = cd.cid
        WHERE {where_sql}
        GROUP BY bd.bill_id, bd.invoice_no, bd.created_at, bd.cust_id, cd.customer_name, cd.phone, bd.batchname, bd.exp_date
        ORDER BY bd.created_at ASC, bd.invoice_no ASC'''

    qty_sql = f'''SELECT COALESCE(SUM(bd.final_qty), 0) AS totalqty 
        FROM bill_details bd 
        LEFT JOIN customer_details cd ON bd.cust_id = cd.cid
        WHERE {where_sql}'''

    with get_db_cursor() as cursor:
        cursor.execute(qty_sql, params)
        qty_row = cursor.fetchone()
        total_qty = int(qty_row['totalqty']) if qty_row and qty_row.get('totalqty') else 0

        cursor.execute(base_sql, params)
        all_rows = cursor.fetchall()
        total_count = len(all_rows)

        paginated_sql = base_sql + ' LIMIT %s OFFSET 5s'
        cursor.execute(paginated_sql, params + [size, offset])
        rows = cursor.fetchall()

        formatted_result = [serialize_row(r) for r in rows]

        return {
            'result': formatted_result,
            'count': total_count,
            'totalqty': total_qty
        }
'"""

with open('app/api/sales/product_wise_customer/router.py', 'w', encoding='utf-8') as f:
    f.write(sales_code)

sales_init = """from fastapi import APIRouter
from .product_wise_customer.router import router as product_wise_customer_router

router = APIRouter()

router.include_router(
    product_wise_customer_router,
    prefix='/product-wise-customer',
    tags=['Sales - Product Wise Customer']
)
"""

with open('app/api/sales/router.py', 'w', encoding='utf-8') as f:
    f.write(sales_init)

with open('app/api/sales/__init__.py', 'w') as f:
    fass =
    pass
    
"
print('Done')
