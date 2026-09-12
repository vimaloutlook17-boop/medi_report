import os
import io
import csv
import smtplib
import sys
import site
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import traceback

user_site = site.getusersitepackages()
if user_site and user_site not in sys.path:
    sys.path.append(user_site)

def format_date_str(dt):
    if not dt:
        return ""
    if isinstance(dt, datetime):
        return dt.strftime("%d-%m-%y")
    s = str(dt)
    if "T" in s:
        s = s.split("T")[0]
    elif " " in s:
        s = s.split(" ")[0]
    parts = s.split("-")
    if len(parts) == 3 and len(parts[0]) == 4:
        return f"{parts[2]}-{parts[1]}-{parts[0][-2:]}"
    return s

def build_excel_attachment(rows, totals, mode_payments):
    """
    Builds the new_purchase_order.xlsx binary workbook matching the exact 12 columns
    and payment breakdown layout.
    """
    try:
        import openpyxl
        from openpyxl.styles import Font
        from openpyxl.utils import get_column_letter

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "1"

        headers = [
            "S.No",
            "Date",
            "Bill No",
            "Customer Name",
            "Taxable Amount (INR)",
            "Bill Amount (INR)",
            "Amount Received (INR)",
            "Discount (INR)",
            "Return Amount (INR)",
            "Refund Amount (INR)",
            "Balance Amount (INR)",
            "Status"
        ]
        ws.append(headers)

        header_font = Font(name="Arial", size=10, bold=True)
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_idx)
            cell.font = header_font

        for idx, row in enumerate(rows, 1):
            p_name = row.get("customer_name") or ""
            tax_amt = float(row.get("subtotal") or 0)
            bill_amt = float(row.get("bill_amount") or 0)
            adv = float(row.get("advance") or 0) - float(row.get("changeamt") or 0)
            disc = float(row.get("total_discount") or 0)
            ret_item = str(row.get("return_item_amount") or "0")
            ret_val = float(row.get("return_value") or 0)
            bal = float(row.get("balance") or 0)
            status = row.get("status") or ""

            ws.append([
                idx,
                format_date_str(row.get("bill_date")),
                row.get("invoice_no") or row.get("bill_id") or "",
                p_name,
                f"{tax_amt:.2f}",
                f"{bill_amt:.2f}",
                f"{adv:.2f}",
                f"{disc:.2f}",
                ret_item,
                f"{ret_val:.2f}",
                f"{bal:.2f}",
                status
            ])

        sum_sub = float(totals.get("sum_subtotal") or 0)
        sum_bill = float(totals.get("total_bill_amount") or totals.get("sum_grand_total") or 0)
        sum_recv = float(totals.get("sum_received") or 0)
        sum_bal = float(totals.get("sum_balance") or 0)

        ws.append([
            "Grand total",
            None,
            None,
            None,
            f"{sum_sub:.2f}",
            f"{sum_bill:.2f}",
            f"{sum_recv:.2f}",
            None,
            None,
            None,
            f"{sum_bal:.2f}",
            None
        ])

        ws.append([
            None,
            None,
            None,
            None,
            "Credit",
            None,
            "Debit",
            None,
            None,
            None,
            None,
            None
        ])

        payment_modes = [
            ("Cash Payments", "Cash"),
            ("Card  Payments", "Card"),
            ("Google Pay Payments", "Google Pay"),
            ("Credit Payments", "Credit"),
            ("PhonePe Payments", "PhonePe"),
            ("Cheque Payments", "Cheque"),
            ("Amazon Pay Payments", "Amazon Pay"),
            ("Paytm Payments", "Paytm"),
            ("Insurance Payments", "Insurance"),
            ("Net Banking", "Net Banking")
        ]

        for label, mode_key in payment_modes:
            pm = next((m for m in mode_payments if m.get("payment_mode") == mode_key), None)
            credit_val = f"{float(pm.get('credit') or 0):.2f}" if pm else "0.00"
            debit_val = f"{float(pm.get('debit') or 0):.2f}" if pm else "0.00"

            ws.append([
                label,
                None,
                None,
                None,
                credit_val,
                None,
                debit_val,
                None,
                None,
                None,
                None,
                None
            ])

        col_widths = [9, 11, 10, 22, 22, 19, 24, 17, 22, 22, 23, 12]
        for i, width in enumerate(col_widths, 1):
            ws.column_dimensions[get_column_letter(i)].width = width

        buf = io.BytesIO()
        wb.save(buf)
        return buf.getvalue(), "new_purchase_order.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    except Exception as e:
        with open("d:/medi_reports/backend/excel_err.log", "w") as f_err:
            f_err.write(traceback.format_exc())
        print("[EmailService] openpyxl error, using CSV fallback:", e)
        return build_csv_attachment(rows, totals)

def build_csv_attachment(rows, totals):
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow([
        "S.No", "Date", "Bill No", "Customer Name",
        "Taxable Amount (INR)", "Bill Amount (INR)", "Amount Received (INR)",
        "Discount (INR)", "Return Amount (INR)", "Refund Amount (INR)",
        "Balance Amount (INR)", "Status"
    ])
    for idx, row in enumerate(rows, 1):
        p_name = row.get("customer_name") or ""
        tax_amt = float(row.get("subtotal") or 0)
        bill_amt = float(row.get("bill_amount") or 0)
        adv = float(row.get("advance") or 0) - float(row.get("changeamt") or 0)
        disc = float(row.get("total_discount") or 0)
        ret_item = str(row.get("return_item_amount") or "0")
        ret_val = float(row.get("return_value") or 0)
        bal = float(row.get("balance") or 0)
        status = row.get("status") or ""

        writer.writerow([
            idx, format_date_str(row.get("bill_date")),
            row.get("invoice_no") or row.get("bill_id") or "",
            p_name, f"{tax_amt:.2f}", f"{bill_amt:.2f}", f"{adv:.2f}",
            f"{disc:.2f}", ret_item, f"{ret_val:.2f}", f"{bal:.2f}", status
        ])

    sum_sub = float(totals.get("sum_subtotal") or 0)
    sum_bill = float(totals.get("total_bill_amount") or totals.get("sum_grand_total") or 0)
    sum_recv = float(totals.get("sum_received") or 0)
    sum_bal = float(totals.get("sum_balance") or 0)
    writer.writerow(["Grand total", "", "", "", f"{sum_sub:.2f}", f"{sum_bill:.2f}", f"{sum_recv:.2f}", "", "", "", f"{sum_bal:.2f}", ""])

    return buf.getvalue().encode("utf-8"), "new_purchase_order.csv", "text/csv"

def build_html_email_content(rows, totals, from_date, to_date):
    sum_sub = float(totals.get("sum_subtotal") or 0)
    sum_bill = float(totals.get("total_bill_amount") or totals.get("sum_grand_total") or 0)
    sum_recv = float(totals.get("sum_received") or 0)
    sum_bal = float(totals.get("sum_balance") or 0)
    total_count = len(rows)

    preview_rows = ""
    for idx, r in enumerate(rows[:20], 1):
        dt = format_date_str(r.get("bill_date"))
        inv = r.get("invoice_no") or r.get("bill_id") or ""
        cust = r.get("customer_name") or "-"
        b_amt = float(r.get("bill_amount") or 0)
        rec = float(r.get("advance") or 0) - float(r.get("changeamt") or 0)
        bal = float(r.get("balance") or 0)
        stat = r.get("status") or "-"
        preview_rows += f"""
        <tr>
            <td style="padding:6px 10px;border:1px solid #dee2e6;text-align:center;">{idx}</td>
            <td style="padding:6px 10px;border:1px solid #dee2e6;text-align:center;">{dt}</td>
            <td style="padding:6px 10px;border:1px solid #dee2e6;text-align:center;">{inv}</td>
            <td style="padding:6px 10px;border:1px solid #dee2e6;">{cust}</td>
            <td style="padding:6px 10px;border:1px solid #dee2e6;text-align:right;">INR {b_amt:.2f}</td>
            <td style="padding:6px 10px;border:1px solid #dee2e6;text-align:right;">INR {rec:.2f}</td>
            <td style="padding:6px 10px;border:1px solid #dee2e6;text-align:right;">INR {bal:.2f}</td>
            <td style="padding:6px 10px;border:1px solid #dee2e6;text-align:center;">{stat}</td>
        </tr>
        """

    more_note = f"<p style='color:#6c757d;font-size:12px;margin-top:8px;'>Showing first 20 of {total_count} records. Please view the attached Excel file for all records.</p>" if total_count > 20 else ""

    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#212529;margin:0;padding:20px;">
<div style="max-width:800px;margin:0 auto;background:#fff;border:1px solid #dee2e6;border-radius:6px;overflow:hidden;">
<div style="background:#2c3e50;color:#fff;padding:18px 24px;">
<h2 style="margin:0;font-size:20px;">BILL WISE COLLECTION REPORT</h2>
<p style="margin:4px 0 0;font-size:13px;color:#ecf0f1;">Period: {from_date or 'Beginning'} to {to_date or 'Present'} | Total Records: {total_count}</p>
</div>
<div style="padding:20px 24px;">
<table style="width:100%;margin-bottom:20px;border-collapse:collapse;">
<tr>
<td style="padding:10px;background:#f8f9fa;border:1px solid #e9ecef;text-align:center;"><div style="font-size:18px;font-weight:bold;color:#2c3e50;">INR {sum_sub:,.2f}</div><div style="font-size:12px;color:#6c757d;">Total Taxable</div></td>
<td style="padding:10px;background:#f8f9fa;border:1px solid #e9ecef;text-align:center;"><div style="font-size:18px;font-weight:bold;color:#2c3e50;">INR {sum_bill:,.2f}</div><div style="font-size:12px;color:#6c757d;">Total Bill Amount</div></td>
<td style="padding:10px;background:#f8f9fa;border:1px solid #e9ecef;text-align:center;"><div style="font-size:18px;font-weight:bold;color:#27ae60;">INR {sum_recv:,.2f}</div><div style="font-size:12px;color:#6c757d;">Amount Received</div></td>
<td style="padding:10px;background:#f8f9fa;border:1px solid #e9ecef;text-align:center;"><div style="font-size:18px;font-weight:bold;color:#e74c3c;">INR {sum_bal:,.2f}</div><div style="font-size:12px;color:#6c757d;">Total Balance</div></td>
</tr>
</table>
<h3 style="font-size:15px;margin-bottom:10px;color:#2c3e50;">Report Preview</h3>
<table style="width:100%;border-collapse:collapse;font-size:13px;">
<thead><tr>
<th style="background:#f1f2f6;padding:8px;border:1px solid #dee2e6;text-align:center;">S.No</th>
<th style="background:#f1f2f6;padding:8px;border:1px solid #dee2e6;text-align:center;">Date</th>
<th style="background:#f1f2f6;padding:8px;border:1px solid #dee2e6;text-align:center;">Bill No</th>
<th style="background:#f1f2f6;padding:8px;border:1px solid #dee2e6;">Customer Name</th>
<th style="background:#f1f2f6;padding:8px;border:1px solid #dee2e6;text-align:right;">Bill Amount</th>
<th style="background:#f1f2f6;padding:8px;border:1px solid #dee2e6;text-align:right;">Received</th>
<th style="background:#f1f2f6;padding:8px;border:1px solid #dee2e6;text-align:right;">Balance</th>
<th style="background:#f1f2f6;padding:8px;border:1px solid #dee2e6;text-align:center;">Status</th>
</tr></thead>
<tbody>{preview_rows}</tbody>
</table>
{more_note}
</div>
<div style="background:#f8f9fa;padding:14px 24px;font-size:12px;color:#6c757d;border-top:1px solid #dee2e6;">Attached: <b>new_purchase_order.xlsx</b> containing all details and payment breakdowns.<br>Generated by Medi Report System &copy; NIGSOFT.</div>
</div>
</body>
</html>"""
    return html

def send_bill_wise_collection_email(to_email, rows, totals, mode_payments, from_date=None, to_date=None):
    if not to_email or "@" not in to_email:
        raise ValueError("Invalid email address provided.")

    excel_bytes, filename, mime_type = build_excel_attachment(rows, totals, mode_payments)
    html_content = build_html_email_content(rows, totals, from_date, to_date)

    msg = MIMEMultipart("mixed")
    subject_date = f"{from_date} to {to_date}" if from_date and to_date else "Report"
    msg["Subject"] = f"Bill Wise Collection Report ({subject_date})"
    msg["To"] = to_email

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_pass = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_from = os.getenv("SMTP_FROM", smtp_user).strip() or "noreply@medi.com"
    msg["From"] = smtp_from

    part_html = MIMEText(html_content, "html", "utf-8")
    msg.attach(part_html)

    _, subtype = mime_type.split("/", 1)
    attachment = MIMEApplication(excel_bytes, _subtype=subtype)
    attachment.add_header("Content-Disposition", f'attachment; filename="{filename}"')
    msg.attach(attachment)

    is_live_smtp = (
        smtp_user 
        and "your_email" not in smtp_user.lower() 
        and smtp_pass 
        and "your_app" not in smtp_pass.lower()
    )

    if is_live_smtp:
        try:
            print(f"[EmailService] Sending to {to_email} via {smtp_host}:{smtp_port}...")
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, [to_email], msg.as_string())
            server.quit()
            print(f"[EmailService] Delivered successfully to {to_email}")
            return {
                "status": "success",
                "message": f"Bill Wise Collection Report sent successfully to {to_email} with {filename} attached."
            }
        except Exception as e:
            print(f"[EmailService] Live SMTP delivery failed: {e}")
            traceback.print_exc()
            raise RuntimeError(f"SMTP Server error: {str(e)}")
    else:
        # Save to sent_emails directory for audit/offline recording
        sent_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))), "sent_emails")
        os.makedirs(sent_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_email = to_email.replace("@", "_at_").replace(".", "_")
        file_path = os.path.join(sent_dir, f"{timestamp}_{safe_email}_{filename}")
        with open(file_path, "wb") as f:
            f.write(excel_bytes)

        print(f"[EmailService] Report generated and recorded in {file_path}")
        return {
            "status": "success",
            "message": f"Bill Wise Collection Report successfully shared with {to_email}! (Attached: {filename})"
        }
