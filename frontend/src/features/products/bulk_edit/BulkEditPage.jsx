import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../AuthContext';
import { apiConfig } from '../../../config';
import Loader from '../../../components/Loader';
import SearchableSelect from '../../../components/SearchableSelect';
import { ApplyFilterButton, ResetButton } from '../../../components/FilterButtons';

import ToExcelButton from '../../../components/ToExcelButton';

export default function BulkEditPage() {
  const { token, refreshAuthToken, isTokenExpired } = useAuth();
  
  // Data state
  const [products, setProducts] = useState([]);
  const [editedProducts, setEditedProducts] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Filter input state
  const [searchTermInput, setSearchTermInput] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');

  // Dropdown lookup options
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [combinationOptions, setCombinationOptions] = useState([]);
  const [manufacturerOptions, setManufacturerOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);

  // Alert message state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const getValidToken = () => {
    return token || localStorage.getItem('jwt_token') || '';
  };

  const handlePrintExcelDownload = async () => {
    try {
      let activeToken = getValidToken();
      if (!activeToken && refreshAuthToken) {
        activeToken = await refreshAuthToken();
      }

      if (!activeToken) {
        setErrorMsg("Authentication token missing.");
        return;
      }

      let url = `${apiConfig.base_url}/products/bulk-edit?page=0&size=-1`;
      if (appliedSearchTerm && appliedSearchTerm.trim()) {
        url += `&search=${encodeURIComponent(appliedSearchTerm.trim())}`;
      }

      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        }
      });

      const result = await response.json();
      if (result.status === 'success' && result.data) {
        const escapeHtml = (str) => {
          if (str === null || str === undefined) return '';
          return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        };

        const headers = ["S.No", "Product Name", "Category", "Combination", "Manufacture", "Location", "Reorder Qty"];

        const tableHtml = `
          <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8" />
            <!--[if gte mso 9]>
            <xml>
              <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                  <x:ExcelWorksheet>
                    <x:Name>Bulk Edit Products</x:Name>
                    <x:WorksheetOptions>
                      <x:DisplayGridlines/>
                    </x:WorksheetOptions>
                  </x:ExcelWorksheet>
                </x:ExcelWorksheets>
              </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <style>
              th { background-color: #e9ecef; font-weight: bold; border: 0.5pt solid #b0b0b0; padding: 6px 14px; text-align: left; font-size: 13px; font-family: Arial, sans-serif; }
              td { border: 0.5pt solid #d0d0d0; padding: 6px 14px; text-align: left; font-size: 12.5px; font-family: Arial, sans-serif; mso-number-format: "\\@"; }
              .num { text-align: right; mso-number-format: "0"; }
              .center { text-align: center; }
            </style>
          </head>
          <body>
            <table>
              <thead>
                <tr>
                  ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${result.data.map((p, i) => `
                  <tr>
                    <td class="center">${i + 1}</td>
                    <td>${escapeHtml(p.name || p.product_name || '')}</td>
                    <td>${escapeHtml(p.category || '')}</td>
                    <td>${escapeHtml(p.combination || '')}</td>
                    <td>${escapeHtml(p.manufacturer || '')}</td>
                    <td>${escapeHtml(p.location || '')}</td>
                    <td class="num">${p.reorder_qty !== undefined && p.reorder_qty !== null ? p.reorder_qty : 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
          </html>
        `;

        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const urlObj = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", urlObj);
        link.setAttribute("download", "bulk_edit_products.xls");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(urlObj);
      } else {
        setErrorMsg("Failed to download Excel report.");
      }
    } catch (err) {
      console.error("[BulkEdit] Export Error:", err);
      setErrorMsg("Error generating Excel download.");
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportMail = () => {
    const subject = encodeURIComponent("Bulk Edit Products Report");
    const body = encodeURIComponent("Please find the bulk edit products report.");
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const fetchProducts = async () => {
    if (products.length === 0) {
      setLoading(true);
    }
    setErrorMsg('');
    setSuccessMsg('');
    try {
      let activeToken = getValidToken();
      if (!activeToken && refreshAuthToken) {
        activeToken = await refreshAuthToken();
      }

      if (!activeToken) {
        setErrorMsg("Authentication token missing. Please re-authenticate.");
        setLoading(false);
        return;
      }

      let url = `${apiConfig.base_url}/products/bulk-edit?page=${page}&size=${size}`;
      if (appliedSearchTerm && appliedSearchTerm.trim()) {
        url += `&search=${encodeURIComponent(appliedSearchTerm.trim())}`;
      }

      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        }
      });

      if (response.status === 401 && refreshAuthToken) {
        activeToken = await refreshAuthToken();
        if (activeToken) {
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`
            }
          });
        }
      }

      const result = await response.json();
      if (result.status === 'success') {
        const cleanVal = (val) => {
          if (!val) return '';
          const s = String(val).trim().toUpperCase();
          if (s === '0' || s === 'NULL' || s === 'UNDEFINED') return '';
          return val;
        };
        const cleanedProducts = (result.data || []).map(p => ({
          ...p,
          category: cleanVal(p.category),
          combination: cleanVal(p.combination),
          manufacturer: cleanVal(p.manufacturer),
          location: cleanVal(p.location)
        }));
        setProducts(cleanedProducts);
        setTotalCount(result.total_count || 0);

        if (result.categories) setCategoryOptions(result.categories);
        if (result.combinations) setCombinationOptions(result.combinations);
        if (result.manufacturers) setManufacturerOptions(result.manufacturers);
        if (result.locations) setLocationOptions(result.locations);

        setEditedProducts({});
      } else {
        setErrorMsg(result.detail || result.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error("[BulkEdit] Auth/Fetch Error:", err);
      setErrorMsg(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, size, appliedSearchTerm]);

  const handleApplyFilters = () => {
    setPage(0);
    setAppliedSearchTerm(searchTermInput);
  };

  const handleResetFilters = () => {
    setSearchTermInput('');
    setAppliedSearchTerm('');
    setPage(0);
  };

  const handleCellChange = (id, field, value) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
    setEditedProducts(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { id }),
        [field]: value
      }
    }));
  };

  const handleSaveAll = async () => {
    const updateList = Object.values(editedProducts);
    if (updateList.length === 0) {
      setSuccessMsg("No changes detected to save.");
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let activeToken = await getValidToken();
      if (!activeToken && refreshAuthToken) {
        activeToken = await refreshAuthToken();
      }

      if (!activeToken) {
        setErrorMsg("Authentication token missing.");
        setSaving(false);
        return;
      }

      let response = await fetch(`${apiConfig.base_url}/products/bulk-edit/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify(updateList)
      });

      if (response.status === 401 && refreshAuthToken) {
        activeToken = await refreshAuthToken();
        if (activeToken) {
          response = await fetch(`${apiConfig.base_url}/products/bulk-edit/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`
            },
            body: JSON.stringify(updateList)
          });
        }
      }

      const result = await response.json();
      if (result.status === 'success') {
        setSuccessMsg(result.message || `Successfully saved ${updateList.length} product(s)!`);
        setEditedProducts({});
        fetchProducts();
      } else {
        setErrorMsg(result.detail || result.message || "Failed to update products.");
      }
    } catch (err) {
      console.error("[BulkEdit] Save Error:", err);
      setErrorMsg(err.message || "Error saving changes.");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(totalCount / size) || 1;
  const startItem = totalCount > 0 ? page * size + 1 : 0;
  const endItem = totalCount > 0 ? Math.min((page + 1) * size, totalCount) : 0;
  const modifiedCount = Object.keys(editedProducts).length;

  return (
    <div className="px-[15px] pt-[10px] pb-8 bg-white min-h-screen text-[13px] text-[#333] font-sans">
      {/* Page Title */}
      <h3 
        className="uppercase"
        style={{ 
          fontSize: '25.2px', 
          lineHeight: '30.24px',
          fontWeight: 500, 
          color: '#323F52', 
          margin: '0px 0px 12px 0px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' 
        }}
      >
        BULK EDIT
      </h3>

      {/* Filter Box Card */}
      <div 
        className="patients-filter-panel bg-white border border-[#ddd] rounded-[4px] p-[12px] mb-[15px]"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', color: '#212529', fontSize: '12.96px' }}
      >
        <div 
          className="patients-filter-title text-[#212529] font-bold text-[14px] mb-[8px] flex items-center"
          style={{ fontFamily: 'Arial, sans-serif', margin: '0px 0px 8px 0px' }}
        >
          <svg className="w-[14px] h-[14px] mr-1.5 text-[#212529] inline fill-current shrink-0" viewBox="0 0 512 512">
            <path d="M487.976 0H24.028C2.71 0-8.047 25.866 7.058 40.971L192 225.941V432c0 7.831 3.821 15.125 10.237 19.599l80 55.998c11.401 7.981 26.855-0.14 26.855-13.999V225.941L494.947 40.971C510.053 25.866 499.296 0 487.976 0z" />
          </svg>
          Filters
        </div>

        <div className="flex flex-wrap items-end gap-[10px]">
          <div className="w-[200px]">
            <SearchableSelect
              id="product_name_filter"
              label="Product Name"
              value={searchTermInput}
              onChange={(opt) => {
                const val = typeof opt === 'object' ? (opt.name || opt.label || '') : String(opt || '');
                setSearchTermInput(val);
              }}
              placeholder="Type 3 chars to search..."
              minChars={3}
              minCharsMessage="Please enter 3 or more characters"
              options={products.map(p => p.name || p.product_name).filter(Boolean)}
            />
          </div>

          <div className="flex items-center gap-[6px]">
            <ApplyFilterButton onClick={handleApplyFilters} />
            <ResetButton onClick={handleResetFilters} />
          </div>

          {/* Button: TO EXCEL */}
          <div className="flex items-center ml-auto">
            <ToExcelButton onClick={handlePrintExcelDownload} />
          </div>

          {modifiedCount > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="h-[35px] px-5 bg-[#28a745] hover:bg-[#218838] text-white rounded-[4px] text-[13px] font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              {saving ? 'Saving Changes...' : `Save All Changes (${modifiedCount})`}
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-[4px] text-[13px] flex justify-between items-center">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="font-bold text-red-700 hover:text-red-900">&times;</button>
        </div>
      )}

      {successMsg && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 text-green-700 rounded-[4px] text-[13px] flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="font-bold text-green-700 hover:text-green-900">&times;</button>
        </div>
      )}

      {/* Pagination Controls Row */}
      <div 
        className="form-inline flex flex-wrap items-center justify-start mb-[12px] pb-[12px] border-b border-[#DEE2E6] text-[#212529]"
        style={{ 
          fontSize: '14px', 
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' 
        }}
      >
        {/* Navigation arrow buttons */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setPage(0)}
            disabled={page === 0}
            className={`btn first ${page === 0 ? 'disabled' : ''} inline-flex items-center justify-center border border-transparent rounded-[3px] focus:outline-none focus:ring-1 focus:ring-[#80bdff]`}
            style={{ 
              width: '28px',
              height: '28px',
              color: page === 0 ? '#adb5bd' : '#212529', 
              cursor: page === 0 ? 'default' : 'pointer',
              backgroundColor: 'transparent'
            }}
            title="First Page"
          >
            <svg className="svg-inline--fa fa-backward fa-w-16 w-[13.5px] h-[13.5px] fill-current" viewBox="0 0 512 512">
              <path d="M11.5 280.6L192 420.7c14.2 11 34 0 34-18V109.3c0-18-19.8-29-34-18L11.5 231.4c-15.3 11.8-15.3 35.4 0 47.2zm204 0L396 420.7c14.2 11 34 0 34-18V109.3c0-18-19.8-29-34-18L215.5 231.4c-15.3 11.8-15.3 35.4 0 47.2z" />
            </svg>
          </button>
          
          <button
            type="button"
            onClick={() => setPage(prev => Math.max(0, prev - 1))}
            disabled={page === 0}
            className={`btn prev ${page === 0 ? 'disabled' : ''} inline-flex items-center justify-center border border-transparent rounded-[3px] ml-1 focus:outline-none focus:ring-1 focus:ring-[#80bdff]`}
            style={{ 
              width: '28px',
              height: '28px',
              color: page === 0 ? '#adb5bd' : '#212529', 
              cursor: page === 0 ? 'default' : 'pointer',
              backgroundColor: 'transparent'
            }}
            title="Previous Page"
          >
            <svg className="svg-inline--fa fa-caret-left fa-w-6 fa-lg w-[6.5px] h-[16.5px] fill-current" viewBox="0 0 192 512">
              <path d="M192 127.3v257.4c0 17.8-21.5 26.7-34.1 14.1L29.1 270.1c-7.8-7.8-7.8-20.5 0-28.3l128.8-128.6c12.6-12.7 34.1-3.7 34.1 14.1z" />
            </svg>
          </button>

          <span 
            className="mx-3.5 font-bold text-[#212529] text-[14px] inline-block select-none tracking-wide"
            style={{ color: '#212529', fontWeight: 700, fontSize: '14px', letterSpacing: '0.4px' }}
          >
            {startItem} to {endItem} ({totalCount})
          </span>

          <button
            type="button"
            onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={page >= totalPages - 1}
            className={`btn next ${page >= totalPages - 1 ? 'disabled' : ''} inline-flex items-center justify-center border border-transparent rounded-[3px] mr-1 focus:outline-none focus:ring-1 focus:ring-[#80bdff]`}
            style={{ 
              width: '28px',
              height: '28px',
              color: page >= totalPages - 1 ? '#adb5bd' : '#212529', 
              cursor: page >= totalPages - 1 ? 'default' : 'pointer',
              backgroundColor: 'transparent'
            }}
            title="Next Page"
          >
            <svg className="svg-inline--fa fa-caret-right fa-w-6 fa-lg w-[6.5px] h-[16.5px] fill-current" viewBox="0 0 192 512">
              <path d="M0 384.7V127.3c0-17.8 21.5-26.7 34.1-14.1l128.8 128.6c7.8 7.8 7.8 20.5 0 28.3L34.1 398.8C21.5 411.4 0 402.5 0 384.7z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className={`btn last ${page >= totalPages - 1 ? 'disabled' : ''} inline-flex items-center justify-center border border-transparent rounded-[3px] focus:outline-none focus:ring-1 focus:ring-[#80bdff]`}
            style={{ 
              width: '28px',
              height: '28px',
              color: page >= totalPages - 1 ? '#adb5bd' : '#212529', 
              cursor: page >= totalPages - 1 ? 'default' : 'pointer',
              backgroundColor: 'transparent'
            }}
            title="Last Page"
          >
            <svg className="svg-inline--fa fa-forward fa-w-16 w-[13.5px] h-[13.5px] fill-current" viewBox="0 0 512 512">
              <path d="M500.5 231.4L320 91.3c-14.2-11-34 0-34 18v293.4c0 18 19.8 29 34 18l180.5-140.1c15.3-11.8 15.3-35.4 0-47.2zM296.5 231.4L116 91.3c-14.2-11-34 0-34 18v293.4c0 18 19.8 29 34 18l180.5-140.1c15.3-11.8 15.3-35.4 0-47.2z" />
            </svg>
          </button>
        </div>

        {/* Page Size Selector */}
        <select
          value={size}
          onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
          className="form-control-sm custom-select pagesize ml-3 border border-[#ced4da] rounded-[4px] bg-white outline-none cursor-pointer appearance-none focus:border-[#80bdff]"
          style={{
            width: '58px',
            height: '33px',
            color: '#495057',
            backgroundColor: '#FFFFFF',
            fontSize: '13.5px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            padding: '3px 18px 3px 8px',
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 12'%3e%3cpath fill='%23343a40' d='M5 0L0 5h10zM5 12L0 7h10z'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 5px center',
            backgroundSize: '8px 10px',
            backgroundRepeat: 'no-repeat'
          }}
          aria-label="Select page size"
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="-1">All</option>
        </select>

        {/* Page Number Selector */}
        <select
          value={page}
          onChange={(e) => setPage(Number(e.target.value))}
          className="form-control-sm custom-select px-4 mx-1 pagenum border border-[#ced4da] rounded-[4px] bg-white outline-none cursor-pointer appearance-none focus:border-[#80bdff]"
          style={{
            width: '58px',
            height: '33px',
            marginLeft: '4px',
            color: '#495057',
            backgroundColor: '#FFFFFF',
            fontSize: '13.5px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            padding: '3px 18px 3px 8px',
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 12'%3e%3cpath fill='%23343a40' d='M5 0L0 5h10zM5 12L0 7h10z'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 5px center',
            backgroundSize: '8px 10px',
            backgroundRepeat: 'no-repeat'
          }}
          aria-label="Select page number"
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <option key={i} value={i}>{i + 1}</option>
          ))}
        </select>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto bg-white">
        <table className="w-full text-left border-collapse text-[13.5px]">
          <thead>
            <tr className="bg-white text-[#212529] font-bold border-b border-[#DEE2E6]">
              <th className="py-2.5 px-3 text-left w-[60px]">S.No</th>
              <th className="py-2.5 px-3 text-left w-[200px]">Product Name</th>
              <th className="py-2.5 px-3 text-left w-[200px]">Category</th>
              <th className="py-2.5 px-3 text-left w-[200px]">Combination</th>
              <th className="py-2.5 px-3 text-left w-[200px]">Manufacture</th>
              <th className="py-2.5 px-3 text-left w-[200px]">Location</th>
              <th className="py-2.5 px-3 text-left w-[130px]">Reorder Qty</th>
            </tr>
          </thead>
          <tbody>
            {loading && products.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center">
                  <Loader />
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-[#6c757d] font-medium">
                  No records found matching search filter.
                </td>
              </tr>
            ) : (
              products.map((row, idx) => {
                const isEdited = !!editedProducts[row.id];
                const isLastRow = idx === products.length - 1;
                return (
                  <tr 
                    key={row.id || idx} 
                    className={`transition-colors ${
                      isLastRow ? '' : 'border-b border-[#E9ECEF]'
                    } ${
                      isEdited ? 'bg-[#FFF8E1]' : 'bg-white hover:bg-[#F8F9FA]'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-left text-[#212529] text-[13.5px]">
                      {page * size + idx + 1}
                    </td>
                    <td className="py-2.5 px-3 text-left text-[#212529] uppercase font-normal text-[13.5px]">
                      {row.name || row.product_name || '-'}
                    </td>
                    <td className="py-1.5 px-2">
                      <SearchableSelect
                        id={`cat_${row.id}`}
                        value={row.category || ''}
                        onChange={(val) => handleCellChange(row.id, 'category', val)}
                        options={categoryOptions}
                        placeholder="Type to search or add Cate..."
                        width="200px"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <SearchableSelect
                        id={`comb_${row.id}`}
                        value={row.combination || ''}
                        onChange={(val) => handleCellChange(row.id, 'combination', val)}
                        options={combinationOptions}
                        placeholder="Type to search or add Com..."
                        width="200px"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <SearchableSelect
                        id={`manu_${row.id}`}
                        value={row.manufacturer || ''}
                        onChange={(val) => handleCellChange(row.id, 'manufacturer', val)}
                        options={manufacturerOptions}
                        placeholder="Type to search or add Man..."
                        width="200px"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <SearchableSelect
                        id={`loc_${row.id}`}
                        value={row.location || ''}
                        onChange={(val) => handleCellChange(row.id, 'location', val)}
                        options={locationOptions}
                        placeholder="Type to search or add Loca..."
                        width="200px"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-left">
                      <input
                        type="number"
                        value={row.reorder_qty !== undefined && row.reorder_qty !== null ? row.reorder_qty : ''}
                        onChange={(e) => handleCellChange(row.id, 'reorder_qty', e.target.value)}
                        className="w-full h-[35px] px-3 text-left border border-[#ced4da] rounded-[4px] text-[13.5px] text-[#212529] outline-none focus:border-[#80bdff] focus:ring-1 focus:ring-[#80bdff] bg-white"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


