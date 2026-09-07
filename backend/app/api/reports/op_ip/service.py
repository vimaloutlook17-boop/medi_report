import pymysql
from typing import Optional, Dict, Any
from app.db import get_db_connection

def fetch_op_ip_report(
    shop_id: int,
    branch_id: int,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    visit_type: Optional[str] = None,
    search_uhid: Optional[str] = None,
    search_patient_id: Optional[str] = None,
    search_patient_name: Optional[str] = None,
    page: int = 0,
    size: int = 10
) -> Dict[str, Any]:
    
    conn = get_db_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            where_clauses = ["b.shop_id = %s"]
            params = [shop_id]
            
            if branch_id >= 0:
                where_clauses.append("b.branch_id = %s")
                params.append(branch_id)
                
            if from_date:
                where_clauses.append("DATE(b.bill_date) >= %s")
                params.append(from_date)
            if to_date:
                where_clauses.append("DATE(b.bill_date) <= %s")
                params.append(to_date)
                
            if visit_type == 'OP':
                where_clauses.append("b.patient_type = 'OUT'")
            elif visit_type == 'IP':
                where_clauses.append("b.patient_type = 'IN'")
            elif visit_type == 'WALK-IN':
                where_clauses.append("(b.patient_type = 'WALK-IN' OR b.patient_type = 'WALK_IN')")
                
            if search_uhid:
                where_clauses.append("c.uhid_values = %s")
                params.append(search_uhid)
            if search_patient_id:
                where_clauses.append("c.customer_id = %s")
                params.append(search_patient_id)
            if search_patient_name:
                where_clauses.append("c.customer_name = %s")
                params.append(search_patient_name)
                
            where_sql = " AND ".join(where_clauses)
            condition = f"WHERE {where_sql} AND (b.bill_status IS NULL OR b.bill_status != 'Holding')"
            
            # Sum and count query
            sum_query = f"""
                SELECT SUM(b.after_final_dis) as total, COUNT(b.bill_id) as numrows
                FROM bill b
                LEFT JOIN customer_details c ON c.cid = b.cust_id
                {condition}
            """
            cursor.execute(sum_query, params)
            sum_res = cursor.fetchone()
            total = sum_res['total'] if sum_res and sum_res['total'] else 0.0
            numrows = sum_res['numrows'] if sum_res and sum_res['numrows'] else 0
            
            # Data query
            limit_clause = ""
            if size > 0 and size < 1000000:
                offset = page * size
                limit_clause = f"LIMIT {offset}, {size}"
                
            data_query = f"""
                SELECT b.*, c.customer_name, c.customer_id, c.uhid_values, c.age, c.age_type
                FROM bill b
                LEFT JOIN customer_details c ON c.cid = b.cust_id
                {condition}
                ORDER BY b.bill_date DESC, b.bill_id DESC
                {limit_clause}
            """
            cursor.execute(data_query, params)
            result = cursor.fetchall()
            
            return {
                "result": result,
                "total": float(total),
                "numrows": numrows
            }
            
    finally:
        conn.close()
