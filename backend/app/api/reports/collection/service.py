from aiomysql import Connection
from typing import Optional

async def fetch_collection_report(
    conn: Connection,
    shop_id: int,
    from_date: str = None,
    to_date: Optional[str] = None,
    bill_no: Optional[str] = None,
    customer_name: Optional[str] = None,
    payment_mode: Optional[str] = None,
    created_by: Optional[str] = None
):
    # Set default dates if not provided
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    from_date = from_date or today
    to_date = to_date or today

    # Base query for details
    details_query = """
        SELECT 
            billing_log.*, 
            customer_details.customer_name, 
            customer_details.phone, 
            users.name as createdby 
        FROM billing_log 
        LEFT JOIN customer_details ON billing_log.cust_id = customer_details.cid 
        LEFT JOIN users ON users.id = billing_log.created_by 
        WHERE billing_log.is_deleted = 'no' 
        AND billing_log.shop_id = %s 
        AND billing_log.branch_id = '0'
    """
    
    # Base query for totals by payment mode
    totals_query = """
        SELECT 
            billing_log.payment_mode, 
            SUM(billing_log.credit) as credit, 
            SUM(billing_log.debit) as debit 
        FROM billing_log 
        LEFT JOIN customer_details ON billing_log.cust_id = customer_details.cid 
        LEFT JOIN users ON users.id = billing_log.created_by 
        WHERE billing_log.is_deleted = 'no' 
        AND billing_log.shop_id = %s 
        AND billing_log.branch_id = '0'
    """

    params = [shop_id]

    if bill_no:
        details_query += " AND (billing_log.invoice_no = %s OR billing_log.bill_id = %s)"
        totals_query += " AND (billing_log.invoice_no = %s OR billing_log.bill_id = %s)"
        params.extend([bill_no, bill_no])
    else:
        details_query += " AND DATE(billing_log.receipt_date) >= %s AND DATE(billing_log.receipt_date) <= %s"
        totals_query += " AND DATE(billing_log.receipt_date) >= %s AND DATE(billing_log.receipt_date) <= %s"
        params.extend([from_date, to_date])

    if customer_name:
        details_query += " AND customer_details.customer_name LIKE %s"
        totals_query += " AND customer_details.customer_name LIKE %s"
        params.append(f"%{customer_name}%")

    if payment_mode:
        pm_clean = payment_mode.strip().lower()
        if pm_clean in ('card', 'credit card', 'debit card'):
            details_query += " AND (billing_log.payment_mode = %s OR billing_log.payment_mode = %s OR billing_log.payment_mode = %s)"
            totals_query += " AND (billing_log.payment_mode = %s OR billing_log.payment_mode = %s OR billing_log.payment_mode = %s)"
            params.extend(['Card', 'Credit Card', 'Debit Card'])
        elif pm_clean in ('google pay', 'gpay', 'google'):
            details_query += " AND (billing_log.payment_mode = %s OR billing_log.payment_mode = %s OR billing_log.payment_mode = %s)"
            totals_query += " AND (billing_log.payment_mode = %s OR billing_log.payment_mode = %s OR billing_log.payment_mode = %s)"
            params.extend(['Google Pay', 'Gpay', 'Google'])
        elif pm_clean in ('phonepe', 'phone pe'):
            details_query += " AND (billing_log.payment_mode = %s OR billing_log.payment_mode = %s)"
            totals_query += " AND (billing_log.payment_mode = %s OR billing_log.payment_mode = %s)"
            params.extend(['PhonePe', 'Phone Pe'])
        elif pm_clean in ('amazon pay', 'amazon'):
            details_query += " AND (billing_log.payment_mode = %s OR billing_log.payment_mode = %s)"
            totals_query += " AND (billing_log.payment_mode = %s OR billing_log.payment_mode = %s)"
            params.extend(['Amazon Pay', 'Amazon'])
        elif pm_clean in ('net banking', 'netbanking'):
            details_query += " AND (billing_log.payment_mode = %s OR billing_log.payment_mode = %s)"
            totals_query += " AND (billing_log.payment_mode = %s OR billing_log.payment_mode = %s)"
            params.extend(['Net Banking', 'Netbanking'])
        elif pm_clean == 'paytm':
            details_query += " AND (billing_log.payment_mode = %s OR billing_log.payment_mode = %s)"
            totals_query += " AND (billing_log.payment_mode = %s OR billing_log.payment_mode = %s)"
            params.extend(['Paytm', 'PAYTM'])
        else:
            details_query += " AND billing_log.payment_mode = %s"
            totals_query += " AND billing_log.payment_mode = %s"
            params.append(payment_mode)

    if created_by:
        details_query += " AND users.name = %s"
        totals_query += " AND users.name = %s"
        params.append(created_by)

    details_query += " ORDER BY billing_log.receipt_date ASC"
    totals_query += " GROUP BY billing_log.payment_mode"

    async with conn.cursor() as cur:
        # Disable ONLY_FULL_GROUP_BY for this session to allow billing_log.* in SELECT with GROUP BY
        await cur.execute("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))")
        
        await cur.execute(details_query, params)
        details_data = await cur.fetchall()

        await cur.execute(totals_query, params)
        totals_data = await cur.fetchall()

    return {
        "data": details_data,
        "totals": totals_data
    }

async def search_customers(
    conn: Connection,
    shop_id: int,
    query: str
):
    search_query = """
        SELECT DISTINCT customer_name, phone 
        FROM customer_details 
        WHERE (customer_name LIKE %s OR phone LIKE %s)
    """
    params = [f"%{query}%", f"%{query}%"]
    
    if shop_id:
        search_query += " AND shop_id = %s"
        params.append(shop_id)
        
    search_query += " LIMIT 10"
    
    async with conn.cursor() as cur:
        await cur.execute(search_query, params)
        results = await cur.fetchall()
    return results

async def search_users(
    conn: Connection,
    shop_id: int,
    query: str
):
    search_query = """
        SELECT DISTINCT id, name
        FROM users
        WHERE name LIKE %s
    """
    params = [f"%{query}%"]
    
    if shop_id:
        search_query += " AND shop_id = %s"
        params.append(shop_id)
        
    search_query += " ORDER BY name ASC LIMIT 10"
    
    async with conn.cursor() as cur:
        await cur.execute(search_query, params)
        results = await cur.fetchall()
    return results
