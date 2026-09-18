import io
import traceback
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from aiomysql import Connection
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from app.database import get_db
from app.auth import verify_token

router = APIRouter()

# Exact SQL query requested for product details with category, combination, manufacture, location, and reorder qty
PRODUCT_EXCEL_SQL = """
SELECT
    x.id,
    x.name,
    IFNULL(ic.name, '') AS category_name,
    IFNULL(c.combination_name, '') AS combination_name,
    IFNULL(m.manu_facturs, '') AS manu_facturs,
    IFNULL(l.location_name, '') AS location_name,
    x.reorder_qty
FROM
(
    SELECT
        p.id,
        p.name,

        COALESCE(
            MAX(NULLIF(pc.category, 0)),
            MAX(NULLIF(i.product_category, 0)),
            0
        ) AS category_id,

        COALESCE(
            MAX(NULLIF(pc.combination, 0)),
            MAX(NULLIF(i.combination, 0)),
            0
        ) AS combination_id,

        COALESCE(
            MAX(NULLIF(pc.manufacture, 0)),
            MAX(NULLIF(i.manufacturer, 0)),
            0
        ) AS manufacture_id,

        COALESCE(
            MAX(NULLIF(pc.location, 0)),
            MAX(NULLIF(i.location, 0)),
            0
        ) AS location_id,

        COALESCE(
            MAX(NULLIF(pc.reorder_qty, '')),
            MAX(NULLIF(i.reorder_qty, 0)),
            0
        ) AS reorder_qty

    FROM (
        SELECT id, name, shop_id
        FROM product_add
        {where_clause}
        ORDER BY id ASC
    ) p

    LEFT JOIN product_categories pc
        ON pc.product = p.id

    LEFT JOIN item i
        ON i.product_table_id = p.id
        AND i.shop_id = %s

    GROUP BY p.id, p.name

) AS x

LEFT JOIN item_categories ic
    ON ic.id = x.category_id

LEFT JOIN combination c
    ON c.id = x.combination_id

LEFT JOIN manufactures m
    ON m.id = x.manufacture_id

LEFT JOIN locations l
    ON l.id = x.location_id

ORDER BY x.id ASC;
"""


async def fetch_product_excel_data(conn: Connection, shop_id: int, search: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Executes the product details query for the given shop_id and optional search keyword.
    """
    params = [shop_id]
    where_conditions = ["shop_id = %s"]

    if search and search.strip():
        where_conditions.append("name LIKE %s")
        params.append(f"%{search.strip()}%")

    where_clause = "WHERE " + " AND ".join(where_conditions)

    # Note: query_params includes shop_id for p subquery and shop_id for item join
    query_params = tuple(params + [shop_id])
    formatted_sql = PRODUCT_EXCEL_SQL.format(where_clause=where_clause)

    async with conn.cursor() as cur:
        await cur.execute(formatted_sql, query_params)
        rows = await cur.fetchall() or []
        return rows


def generate_product_excel_bytes(rows: List[Dict[str, Any]]) -> bytes:
    """
    Generates an Excel binary (.xlsx) file in memory using openpyxl.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Products Export"

    # Display gridlines in Excel
    ws.views.sheetView[0].showGridLines = True

    # Styling definitions
    header_font = Font(name="Calibri", size=11, bold=True, color="1F4E78")
    header_fill = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
    header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

    data_font = Font(name="Calibri", size=10)
    data_align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)
    data_align_right = Alignment(horizontal="right", vertical="center", wrap_text=True)
    data_align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)

    thin_side = Side(style="thin", color="D9D9D9")
    border_thin = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)

    headers = [
        "S.No",
        "Product ID",
        "Product Name",
        "Category Name",
        "Combination Name",
        "Manufacturer Name",
        "Location Name",
        "Reorder Qty"
    ]

    ws.append(headers)
    ws.row_dimensions[1].height = 25

    for col_num in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_num)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_align
        cell.border = border_thin

    row_idx = 2
    for item in rows:
        reorder_val = item.get("reorder_qty")
        try:
            reorder_val = int(reorder_val) if reorder_val is not None else 0
        except (ValueError, TypeError):
            reorder_val = 0

        row_data = [
            row_idx - 1,
            item.get("id", ""),
            item.get("name", "") or "",
            item.get("category_name", "") or "",
            item.get("combination_name", "") or "",
            item.get("manu_facturs", "") or "",
            item.get("location_name", "") or "",
            reorder_val
        ]

        ws.append(row_data)

        # Apply cell alignments
        ws.cell(row=row_idx, column=1).alignment = data_align_center  # S.No
        ws.cell(row=row_idx, column=2).alignment = data_align_center  # Product ID
        ws.cell(row=row_idx, column=3).alignment = data_align_left    # Product Name
        ws.cell(row=row_idx, column=4).alignment = data_align_left    # Category
        ws.cell(row=row_idx, column=5).alignment = data_align_left    # Combination
        ws.cell(row=row_idx, column=6).alignment = data_align_left    # Manufacturer
        ws.cell(row=row_idx, column=7).alignment = data_align_left    # Location
        ws.cell(row=row_idx, column=8).alignment = data_align_right   # Reorder Qty

        for col_num in range(1, len(headers) + 1):
            cell = ws.cell(row=row_idx, column=col_num)
            cell.font = data_font
            cell.border = border_thin

        row_idx += 1

    # Auto-adjust column widths with maximum limit of 35 to allow wrapping long text into 2 lines
    for col in ws.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            val_str = str(cell.value or "")
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = min(max(max_len + 4, 12), 35)

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output.getvalue()


@router.get("/export-excel")
async def export_products_to_excel(
    search: Optional[str] = Query(None, description="Search keyword for Product Name"),
    shop_id_param: Optional[int] = Query(None, alias="shop_id", description="Optional Shop ID parameter"),
    conn: Connection = Depends(get_db),
    token_shop_id: int = Depends(verify_token)
):
    """
    Export product report with Category, Combination, Manufacture, Location, and Reorder Qty to an Excel file (.xlsx).
    """
    try:
        effective_shop_id = shop_id_param if shop_id_param else token_shop_id
        if not effective_shop_id:
            effective_shop_id = 1971

        rows = await fetch_product_excel_data(conn=conn, shop_id=effective_shop_id, search=search)
        excel_bytes = generate_product_excel_bytes(rows)

        filename = "bulk_edit_products.xlsx"

        return StreamingResponse(
            io.BytesIO(excel_bytes),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate Excel file: {str(e)}")
