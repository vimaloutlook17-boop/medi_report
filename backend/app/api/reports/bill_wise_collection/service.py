from aiomysql import Connection
from typing import Optional

async def fetch_bill_wise_collection_report(
    conn: Connection,
    shop_id: int,
    from_date: str = None,
    to_date: Optional[str] = None,
    bill_no: Optional[str] = None,
    customer_name: Optional[str] = None,
    status: Optional[str] = None,
    branch_id: int = 0
):
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    from_date = from_date or today
    to_date = to_date or today

    where_clauses = ["(b.bill_status IS NULL OR b.bill_status != 'Holding')", "b.shop_id = %s", "b.is_deleted = 'no'"]
    params = [shop_id]
    
    if branch_id > 0:
        where_clauses.append("b.branch_id = %s")
        params.append(branch_id)
        
    if status and status != 'All':
        where_clauses.append("b.status = %s")
        params.append(status)
        
    # Parse customer_name early — needed to decide whether to skip date filter
    cust_filter_name = None
    cust_filter_bill = None
    if customer_name:
        raw_cust = str(customer_name).strip()
        if " - Bill No:" in raw_cust:
            cust_filter_name = raw_cust.split(" - Bill No:")[0].strip()
            cust_filter_bill = raw_cust.split(" - Bill No:")[1].strip()
        elif " - " in raw_cust:
            cust_filter_name = raw_cust.split(" - ")[0].strip()
        else:
            cust_filter_name = raw_cust

    skip_date = bool(bill_no) or bool(cust_filter_bill)

    if bill_no:
        clean_bill_no = str(bill_no).split(" - ")[0].strip()
        where_clauses.append("(b.invoice_no = %s OR CAST(b.bill_id AS CHAR) = %s)")
        params.extend([clean_bill_no, clean_bill_no])
    elif not skip_date:
        where_clauses.append("DATE(b.bill_date) >= %s")
        where_clauses.append("DATE(b.bill_date) <= %s")
        params.extend([from_date, to_date])

    if cust_filter_name:
        where_clauses.append("c.customer_name LIKE %s")
        params.append(f"%{cust_filter_name}%")
    if cust_filter_bill:
        where_clauses.append("(b.invoice_no = %s OR CAST(b.bill_id AS CHAR) = %s)")
        params.extend([cust_filter_bill, cust_filter_bill])
        
    where_str = " AND ".join(where_clauses)
    
    # DEBUG - print to server logs
    print(f"[BWC DEBUG] bill_no received: {repr(bill_no)}")
    print(f"[BWC DEBUG] customer_name received: {repr(customer_name)}")
    print(f"[BWC DEBUG] WHERE: {where_str}")
    print(f"[BWC DEBUG] params: {params}")

    query = f"""
        SELECT 
            b.shop_id, 
            b.branch_id, 
            b.changeamt, 
            b.bill_date, 
            b.bill_id, 
            b.invoice_no, 
            b.totaltax, 
            b.subtotal, 
            b.grand_total, 
            b.after_final_dis as bill_amount,
            b.advance, 
            b.balance, 
            b.status, 
            b.payment_mode, 
            b.return_value, 
            b.return_item_amount, 
            b.cust_id, 
            b.total_discount, 
            b.round_of, 
            c.customer_name,
            c.phone,
            COALESCE(SUM(bl.debit), 0) AS debit, 
            COALESCE(SUM(bl.credit), 0) AS credit,
            COALESCE(SUM(bl.credit), 0) AS collected_amount
        FROM bill b 
        LEFT JOIN customer_details c ON b.cust_id = c.cid
        LEFT JOIN billing_log bl ON b.bill_id = bl.bill_id AND bl.is_deleted = 'no'
        WHERE {where_str}
        GROUP BY b.bill_id
        ORDER BY b.bill_id ASC
    """
    
    sum_query = f"""
        SELECT 
            COALESCE(SUM(b.totaltax), 0) as sum_totaltax,
            COALESCE(SUM(b.subtotal), 0) as sum_subtotal,
            COALESCE(SUM(b.grand_total), 0) as sum_grand_total, 
            COALESCE(SUM(b.advance), 0) as sum_advance,
            COALESCE(SUM(b.changeamt), 0) as sum_change,
            (COALESCE(SUM(b.advance), 0) - COALESCE(SUM(b.changeamt), 0)) as sum_received,
            COALESCE(SUM(b.balance), 0) as sum_balance
        FROM bill b
    """
    
    if cust_filter_name:
        sum_query += " LEFT JOIN customer_details c ON b.cust_id = c.cid "

    sum_query += f" WHERE {where_str}"
    
    async with conn.cursor() as cur:
        await cur.execute(query, params)
        data = await cur.fetchall()
        
        await cur.execute(sum_query, params)
        sum_result = await cur.fetchone()
        
    bill_ids = [str(row['bill_id']) for row in data]
    mode_payments = []
    
    if bill_ids:
        placeholders = ','.join(['%s'] * len(bill_ids))
        sqlpay = f"""
            SELECT 
                payment_mode, 
                SUM(CAST(credit AS DECIMAL(10,2))) AS credit, 
                SUM(CAST(debit AS DECIMAL(10,2))) AS debit, 
                SUM(balance) as bal 
            FROM billing_log 
            WHERE bill_id IN ({placeholders}) 
            AND shop_id = %s AND branch_id = %s 
            AND is_deleted = 'no'
            GROUP BY payment_mode
        """
        pay_params = bill_ids + [shop_id, branch_id]
        async with conn.cursor() as cur:
            await cur.execute(sqlpay, pay_params)
            mode_payments = await cur.fetchall()
            
    grand_total_bill = sum(float(row.get('bill_amount') or 0) for row in data)
    grand_total_collected = sum(float(row.get('collected_amount') or 0) for row in data)
            
    totals = {
        "sum_totaltax": float(sum_result['sum_totaltax'] or 0) if sum_result else 0,
        "sum_subtotal": float(sum_result['sum_subtotal'] or 0) if sum_result else 0,
        "sum_grand_total": float(sum_result['sum_grand_total'] or 0) if sum_result else 0,
        "sum_advance": float(sum_result['sum_advance'] or 0) if sum_result else 0,
        "sum_change": float(sum_result['sum_change'] or 0) if sum_result else 0,
        "sum_received": float(sum_result['sum_received'] or 0) if sum_result else 0,
        "sum_balance": float(sum_result['sum_balance'] or 0) if sum_result else 0,
        "total_bill_amount": grand_total_bill,
        "total_collected_amount": grand_total_collected
    }
    
    return {
        "data": data,
        "totals": totals,
        "mode_payments": mode_payments
    }

async def search_bills(conn: Connection, shop_id: int, query: str):
    search_query = """
        SELECT b.invoice_no, c.customer_name 
        FROM bill b
        LEFT JOIN customer_details c ON b.cust_id = c.cid
        WHERE b.shop_id = %s 
        AND b.is_deleted = 'no'
        AND (b.bill_status IS NULL OR b.bill_status != 'Holding')
        AND (b.invoice_no LIKE %s OR CAST(b.bill_id AS CHAR) LIKE %s)
        ORDER BY CASE WHEN b.invoice_no = %s OR CAST(b.bill_id AS CHAR) = %s THEN 0 ELSE 1 END, b.bill_id DESC
        LIMIT 50
    """
    params = [shop_id, f"%{query}%", f"%{query}%", query, query]
    
    async with conn.cursor() as cur:
        await cur.execute(search_query, params)
        data = await cur.fetchall()
        
    return data

async def search_customers(conn: Connection, shop_id: int, query: str):
    search_query = """
        SELECT c.cid, c.customer_name, MAX(b.invoice_no) as invoice_no
        FROM customer_details c
        LEFT JOIN bill b ON c.cid = b.cust_id AND b.shop_id = %s
        WHERE c.customer_name LIKE %s 
        AND c.shop_id = %s
        GROUP BY c.cid, c.customer_name
        ORDER BY CASE WHEN c.customer_name = %s THEN 0 ELSE 1 END, c.customer_name ASC
        LIMIT 50
    """
    params = [shop_id, f"%{query}%", shop_id, query]
    
    async with conn.cursor() as cur:
        await cur.execute(search_query, params)
        data = await cur.fetchall()
        
    return data
