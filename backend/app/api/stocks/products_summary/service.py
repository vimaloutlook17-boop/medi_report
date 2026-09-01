from typing import List, Optional
from datetime import date, timedelta
import calendar
from aiomysql import Connection

async def fetch_product_summary(conn: Connection, shop_id: int, product_id: str, date_filter: str, from_date: Optional[str] = None, to_date: Optional[str] = None, size: int = 10, page: int = 0):
    offset = page * size

    # Date calculations
    cur_date = date.today()
    yesterday = cur_date - timedelta(days=1)
    last_7_days = cur_date - timedelta(days=7)
    
    start_current_month = cur_date.replace(day=1)
    end_current_month = cur_date.replace(day=calendar.monthrange(cur_date.year, cur_date.month)[1])
    
    first_day_last_month = (cur_date.replace(day=1) - timedelta(days=1)).replace(day=1)
    last_day_last_month = first_day_last_month.replace(day=calendar.monthrange(first_day_last_month.year, first_day_last_month.month)[1])

    # Date conditions for transactions
    date_condition_po = ""
    date_condition_srr = ""
    date_condition_bill = ""
    date_condition_os = ""
    date_condition_su = ""
    
    query_params = []

    if date_filter == 'Today':
        date_condition_po = " AND DATE(purchase_order.invoice_date) = %s"
        date_condition_srr = " AND DATE(srr.received_date) = %s"
        date_condition_bill = " AND DATE(bill_details.bill_date) = %s"
        date_condition_os = " AND DATE(opening_stock.date) = %s"
        date_condition_su = " AND DATE(stock_update.created_at) = %s"
        query_params = [cur_date]
    elif date_filter == 'Yesterday':
        date_condition_po = " AND DATE(purchase_order.invoice_date) = %s"
        date_condition_srr = " AND DATE(srr.received_date) = %s"
        date_condition_bill = " AND DATE(bill_details.bill_date) = %s"
        date_condition_os = " AND DATE(opening_stock.date) = %s"
        date_condition_su = " AND DATE(stock_update.created_at) = %s"
        query_params = [yesterday]
    elif date_filter == 'Last_7':
        date_condition_po = " AND DATE(purchase_order.invoice_date) BETWEEN %s AND %s"
        date_condition_srr = " AND DATE(srr.received_date) BETWEEN %s AND %s"
        date_condition_bill = " AND DATE(bill_details.bill_date) BETWEEN %s AND %s"
        date_condition_os = " AND DATE(opening_stock.date) BETWEEN %s AND %s"
        date_condition_su = " AND DATE(stock_update.created_at) BETWEEN %s AND %s"
        query_params = [last_7_days, cur_date]
    elif date_filter == 'current_month':
        date_condition_po = " AND DATE(purchase_order.invoice_date) BETWEEN %s AND %s"
        date_condition_srr = " AND DATE(srr.received_date) BETWEEN %s AND %s"
        date_condition_bill = " AND DATE(bill_details.bill_date) BETWEEN %s AND %s"
        date_condition_os = " AND DATE(opening_stock.date) BETWEEN %s AND %s"
        date_condition_su = " AND DATE(stock_update.created_at) BETWEEN %s AND %s"
        query_params = [start_current_month, end_current_month]
    elif date_filter == 'Last_month':
        date_condition_po = " AND DATE(purchase_order.invoice_date) BETWEEN %s AND %s"
        date_condition_srr = " AND DATE(srr.received_date) BETWEEN %s AND %s"
        date_condition_bill = " AND DATE(bill_details.bill_date) BETWEEN %s AND %s"
        date_condition_os = " AND DATE(opening_stock.date) BETWEEN %s AND %s"
        date_condition_su = " AND DATE(stock_update.created_at) BETWEEN %s AND %s"
        query_params = [first_day_last_month, last_day_last_month]
    elif date_filter == 'Custom' and from_date and to_date:
        date_condition_po = " AND DATE(purchase_order.invoice_date) BETWEEN %s AND %s"
        date_condition_srr = " AND DATE(srr.received_date) BETWEEN %s AND %s"
        date_condition_bill = " AND DATE(bill_details.bill_date) BETWEEN %s AND %s"
        date_condition_os = " AND DATE(opening_stock.date) BETWEEN %s AND %s"
        date_condition_su = " AND DATE(stock_update.created_at) BETWEEN %s AND %s"
        query_params = [from_date, to_date]

    # Check shop config
    async with conn.cursor() as cur:
        await cur.execute("SELECT stock_room FROM shop_configuration WHERE shop_id = %s", (shop_id,))
        config = await cur.fetchone()
        is_stock_room_enabled = config and config.get('stock_room') == 'YES'

    # Build params for the massive UNION query
    # It requires product_id, shop_id, and the date parameters repeated for each SELECT
    po_params = [product_id] + query_params + [shop_id]
    srr_params = [product_id] + query_params + [shop_id]
    bill_params_1 = [product_id] + query_params + [shop_id]
    bill_params_2 = [product_id] + query_params + [shop_id]
    su_params = [product_id, shop_id] + query_params
    pr_params = [product_id, shop_id]
    sr_params = [product_id] + query_params + [shop_id]

    if is_stock_room_enabled:
        purchase_sql = f"""
            SELECT srr.received_date as invoicedate, 'Purchase' as vendorname, SUM(srri.total_qty) as purchaseqty, NULL as saleqty,
            'purchase' as type, srr.user_id as created_by,
            NULL as returnqty, NULL as purchase_returnqty, srr.created_at as created_date_time
            FROM stock_room_transaction_receipt_items srri
            JOIN stock_room_transaction_receipts srr on srr.id = srri.receipt_id
            WHERE srri.item_id = %s {date_condition_srr} and srri.shop_id = %s
            GROUP BY srr.id
            UNION ALL
            SELECT purchase_order.invoice_date as invoicedate, 'Purchase' as vendorname, SUM(purchase_order_item.stotalqty) as purchaseqty, NULL as saleqty, 
            'purchase' as type, purchase_order.updated_by as created_by,
            NULL as returnqty, NULL as purchase_returnqty, purchase_order_item.created_at as created_date_time
            FROM purchase_order_item JOIN purchase_order on purchase_order.purchase_order_id = purchase_order_item.po_id 
            WHERE purchase_order_item.item_id = %s {date_condition_po} and purchase_order.shop_id = %s
            AND purchase_order.save_later = 'complete'
            AND (purchase_order.stock_room IS NULL OR purchase_order.stock_room != 'YES')
            GROUP BY purchase_order.purchase_order_id
        """
        all_params = srr_params + po_params + bill_params_1 + bill_params_2 + su_params + pr_params + sr_params
    else:
        purchase_sql = f"""
            SELECT purchase_order.invoice_date as invoicedate, 'Purchase' as vendorname, SUM(purchase_order_item.stotalqty) as purchaseqty, NULL as saleqty, 
            'purchase' as type, purchase_order.updated_by as created_by,
            NULL as returnqty, NULL as purchase_returnqty, purchase_order_item.created_at as created_date_time
            FROM purchase_order_item JOIN purchase_order on purchase_order.purchase_order_id = purchase_order_item.po_id 
            WHERE purchase_order_item.item_id = %s {date_condition_po} and purchase_order.shop_id = %s
            AND purchase_order.save_later = 'complete'
            GROUP BY purchase_order.purchase_order_id
        """
        all_params = po_params + bill_params_1 + bill_params_2 + su_params + pr_params + sr_params

    full_sql = f"""
        {purchase_sql}
        UNION
        SELECT bill_details.bill_date as invoicedate, 'Sales' as vendorname, NULL as purchaseqty, SUM(bill_details.final_qty) as saleqty, 
        'sales' as type, created_by as created_by,
        NULL as returnqty, NULL as purchase_returnqty, bill_details.bill_date as created_date_time
        FROM bill_details WHERE bill_details.item_id = %s {date_condition_bill} and bill_details.shop_id = %s 
        GROUP BY DATE(bill_details.bill_date), bill_details.created_by
        UNION
        SELECT bill_details.bill_date as invoicedate, 'Free Qty' as vendorname, NULL as purchaseqty, SUM(bill_details.free_qty) as saleqty, 
        'sales' as type, created_by as created_by,
        NULL as returnqty, NULL as purchase_returnqty, bill_details.bill_date as created_date_time
        FROM bill_details WHERE bill_details.item_id = %s {date_condition_bill} and bill_details.shop_id = %s 
        AND bill_details.free_qty != 0
        GROUP BY DATE(bill_details.bill_date), bill_details.created_by
        UNION
        SELECT date(stock_update.created_at) as invoicedate, 'Stock Update' as vendorname,
        CASE WHEN type='Sales Return' THEN NULL ELSE SUM(diff_qty) END as purchaseqty, NULL as saleqty, 
        type as type, created_by as created_by,
        CASE WHEN type='Sales Return' THEN SUM(diff_qty) ELSE NULL END as returnqty, NULL as purchase_returnqty, stock_update.created_at as created_date_time
        FROM stock_update WHERE stock_update.item_id = %s and stock_update.shop_id = %s and stock_update.diff_qty != 0 {date_condition_su} 
        GROUP BY DATE(stock_update.created_at), stock_update.created_by, type
        UNION
        SELECT date(purchase_return_entry.created_at) as invoicedate, 'Return Purchase' as vendorname, NULL as purchaseqty, NULL as saleqty, 
        NULL as type, created_by as created_by,
        NULL as returnqty, SUM(return_qty) as purchase_returnqty, purchase_return_entry.created_at as created_date_time
        FROM purchase_return_entry WHERE purchase_return_entry.item_id = %s and purchase_return_entry.shop_id = %s
        GROUP BY DATE(purchase_return_entry.created_at), id
        UNION
        SELECT bill_details.bill_date as invoicedate, 'Return Sales' as vendorname, NULL as purchaseqty, NULL as saleqty, 
        'return' as type, created_by as created_by,
        SUM(returned_qty) as returnqty, NULL as purchase_returnqty, bill_details.created_at as created_date_time
        FROM bill_details WHERE bill_details.item_id = %s {date_condition_bill} and bill_details.shop_id = %s AND bill_details.returned_qty != 0
        GROUP BY DATE(bill_details.bill_date), bill_details.created_by
        ORDER BY created_date_time ASC
    """

    if size != -1:
        full_sql += " LIMIT %s, %s"
        all_params.extend([offset, size])

    # Fetch main data
    async with conn.cursor() as cur:
        await cur.execute(full_sql, tuple(all_params))
        transactions = await cur.fetchall()

    # Calculate before_date for the opening balance
    before_date = None
    if date_filter == 'Today':
        before_date = yesterday
    elif date_filter == 'Yesterday':
        before_date = cur_date - timedelta(days=2)
    elif date_filter == 'Last_7':
        before_date = cur_date - timedelta(days=8)
    elif date_filter == 'current_month':
        before_date = (start_current_month - timedelta(days=1))
    elif date_filter == 'Last_month':
        before_date = (first_day_last_month - timedelta(days=1))
    elif date_filter == 'Custom' and from_date:
        before_date = date.fromisoformat(from_date) - timedelta(days=1)

    final_before_qty = 0
    if before_date:
        before_po_params = [product_id, shop_id, before_date]
        before_srr_params = [product_id, shop_id, before_date]
        
        if is_stock_room_enabled:
            before_purchase_sql = """
            SELECT SUM(received_purchase_qty) as purchase_qty, 0 as sales_qty, 0 as free_qty, 0 as stock_update_qty, 0 as sales_return_qty, 0 as purchase_return_qty
            FROM (
                SELECT srri.total_qty as received_purchase_qty
                FROM stock_room_transaction_receipt_items srri
                JOIN stock_room_transaction_receipts srr ON srr.id = srri.receipt_id
                WHERE srri.item_id = %s AND srri.shop_id = %s AND DATE(srr.received_date) <= %s
                UNION ALL
                SELECT purchase_order_item.stotalqty as received_purchase_qty
                FROM purchase_order_item
                JOIN purchase_order ON purchase_order.purchase_order_id = purchase_order_item.po_id
                WHERE purchase_order_item.item_id = %s AND purchase_order.shop_id = %s
                    AND purchase_order.save_later = 'complete'
                    AND (purchase_order.stock_room IS NULL OR purchase_order.stock_room != 'YES')
                    AND DATE(purchase_order.invoice_date) <= %s
            ) stock_room_purchase_summary
            """
            before_all_params = before_srr_params + before_po_params
        else:
            before_purchase_sql = """
            SELECT SUM(purchase_order_item.stotalqty) as purchase_qty, 0 as sales_qty, 0 as free_qty, 0 as stock_update_qty, 0 as sales_return_qty, 0 as purchase_return_qty
            FROM purchase_order_item 
            JOIN purchase_order ON purchase_order.purchase_order_id = purchase_order_item.po_id
            WHERE purchase_order_item.item_id = %s AND purchase_order.shop_id = %s
                AND purchase_order.save_later = 'complete'
                AND DATE(purchase_order.invoice_date) <= %s
            """
            before_all_params = before_po_params

        summary_sql = f"""
        SELECT 
            IFNULL(SUM(purchase_qty), 0) as total_purchase_qty,
            IFNULL(SUM(sales_qty), 0) as total_sales_qty,
            IFNULL(SUM(free_qty), 0) as total_free_qty,
            IFNULL(SUM(stock_update_qty), 0) as total_stock_update_qty,
            IFNULL(SUM(sales_return_qty), 0) as total_sales_return_qty,
            IFNULL(SUM(purchase_return_qty), 0) as total_purchase_return_qty
        FROM (
            {before_purchase_sql}
            UNION ALL
            SELECT 0, SUM(bill_details.final_qty), 0, 0, 0, 0
            FROM bill_details 
            WHERE bill_details.item_id = %s AND bill_details.shop_id = %s AND DATE(bill_details.bill_date) <= %s
            UNION ALL
            SELECT 0, 0, SUM(bill_details.free_qty), 0, 0, 0
            FROM bill_details 
            WHERE bill_details.item_id = %s AND bill_details.shop_id = %s AND bill_details.free_qty != 0 AND DATE(bill_details.bill_date) <= %s
            UNION ALL
            SELECT 0, 0, 0, SUM(stock_update.diff_qty), 0, 0
            FROM stock_update 
            WHERE stock_update.item_id = %s AND stock_update.shop_id = %s AND DATE(stock_update.created_at) <= %s
            UNION ALL
            SELECT 0, 0, 0, 0, SUM(bill_details.returned_qty), 0
            FROM bill_details 
            WHERE bill_details.item_id = %s AND bill_details.shop_id = %s AND bill_details.returned_qty != 0 AND DATE(bill_details.bill_date) <= %s
            UNION ALL
            SELECT 0, 0, 0, 0, 0, SUM(purchase_return_entry.return_qty)
            FROM purchase_return_entry 
            WHERE purchase_return_entry.item_id = %s AND purchase_return_entry.shop_id = %s AND DATE(purchase_return_entry.created_at) <= %s
        ) as stock_summary
        """
        
        # Add params for the 5 extra queries
        for _ in range(5):
            before_all_params.extend([product_id, shop_id, before_date])
            
        async with conn.cursor() as cur:
            await cur.execute(summary_sql, tuple(before_all_params))
            summary_row = await cur.fetchone()
            
            if summary_row:
                total_purchase_qty = summary_row.get('total_purchase_qty', 0)
                total_sales_qty = summary_row.get('total_sales_qty', 0)
                total_free_qty = summary_row.get('total_free_qty', 0)
                total_stock_update_qty = summary_row.get('total_stock_update_qty', 0)
                total_sales_return_qty = summary_row.get('total_sales_return_qty', 0)
                total_purchase_return_qty = summary_row.get('total_purchase_return_qty', 0)
                
                final_before_qty = (
                    float(total_purchase_qty) + float(total_stock_update_qty)
                    - (float(total_sales_qty) + float(total_free_qty))
                    + float(total_sales_return_qty)
                ) - float(total_purchase_return_qty)

    # Calculate total count for pagination
    # We run the main query as a COUNT() wrapper
    count_sql = f"SELECT COUNT(*) as total_count FROM ({full_sql.split('ORDER BY')[0]}) as c"
    count_params = all_params[:-2] if size != -1 else all_params
    async with conn.cursor() as cur:
        await cur.execute(count_sql, tuple(count_params))
        count_row = await cur.fetchone()
        total_count = count_row['total_count'] if count_row else 0

    return {
        "data": transactions,
        "final_qty_before_date": final_before_qty,
        "total_count": total_count
    }
