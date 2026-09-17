import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { useAuth } from '../../../AuthContext';
import PaginationControls from '../../../components/PaginationControls';
import { ApplyFilterButton, ResetButton } from '../../../components/FilterButtons';
import ToPdfButton from '../../../components/ToPdfButton';
import ToCsvButton from '../../../components/ToCsvButton';
import { apiConfig } from '../../../config';


export default function CollectionReportPage() {
  const { token } = useAuth();
  const [dateFilter, setDateFilter] = useState('Today');
  const [billNo, setBillNo] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSearchText, setCustomerSearchText] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [paymentMode, setPaymentMode] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; // simple YYYY-MM-DD
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [reportData, setReportData] = useState([]);
  const [totals, setTotals] = useState({ credit: 0, debit: 0, cashInHand: 0 });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('T');
    if (parts.length !== 2) return dateStr.replace('T', ' ');
    const [y, m, d] = parts[0].split('-');
    const [H, M, S] = parts[1].split(':');
    let h = parseInt(H, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    const hp = h.toString().padStart(2, '0');
    return `${d}-${m}-${y} ${hp}:${M} ${ampm}`;
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined || val === '') return '0';
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    if (num % 1 === 0) return num.toString();
    return num.toFixed(2);
  };

  
  const handleDateFilterChange = (e) => {
    const val = e.target.value;
    setDateFilter(val);
    
    const today = new Date();
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    if (val === 'Today') {
      setFromDate(formatDate(today));
      setToDate(formatDate(today));
    } else if (val === 'Yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      setFromDate(formatDate(yesterday));
      setToDate(formatDate(yesterday));
    } else if (val === 'Last 7 Days') {
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 6);
      setFromDate(formatDate(last7));
      setToDate(formatDate(today));
    } else if (val === 'Current Month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setFromDate(formatDate(firstDay));
      setToDate(formatDate(lastDay));
    } else if (val === 'Last Month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
      setFromDate(formatDate(firstDay));
      setToDate(formatDate(lastDay));
    }
  };

  
  const handlePaymentTableKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActivePaymentRowIndex(prev => (prev < paymentModes.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActivePaymentRowIndex(prev => (prev > 0 ? prev - 1 : prev));
    }
  };

  
  const handleExportCSV = () => {
    const wsData = [
      ['S.No', 'Date', 'Bill No', 'Customer Name', 'Received(Rs)', 'Refund(Rs)', 'Payment Mode', 'Created By']
    ];
    
    reportData.forEach((row, idx) => {
      wsData.push([
        idx + 1,
        formatDateTime(row.receipt_date),
        row.invoice_no || '',
        row.customer_name || '',
        row.credit || 0,
        row.debit || 0,
        row.payment_mode || '',
        row.createdby || ''
      ]);
    });
    
    wsData.push(["", "", "", "Grand total", totals.credit, totals.debit, "", ""]);
    wsData.push(["", "", "", "Cash in Hand", totals.cashInHand, "", "", ""]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 8 },  // S.No
      { wch: 22 }, // Date
      { wch: 12 }, // Bill No
      { wch: 35 }, // Customer Name
      { wch: 15 }, // Received
      { wch: 15 }, // Refund
      { wch: 18 }, // Payment Mode
      { wch: 15 }  // Created By
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Collection Report");
    XLSX.writeFile(wb, "Collection_Report.xlsx");
  };

  
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("Collection Report", 14, 15);
    
    const headers = [['S.No', 'Date', 'Bill No', 'Customer Name', 'Receive', 'Refund', 'Payment Mode', 'Created By']];
    
    const data = reportData.map((row, idx) => [
      idx + 1,
      formatDateTime(row.receipt_date),
      row.invoice_no || '',
      row.customer_name || '',
      row.credit || 0,
      row.debit || 0,
      row.payment_mode || '',
      row.createdby || ''
    ]);
    
    const footData = [
      ['Grand total', '', '', '', formatCurrency(totals.credit), formatCurrency(totals.debit), '', ''],
      ['Cash in Hand', '', '', '', formatCurrency(totals.cashInHand), '', '', '']
    ];

    autoTable(doc, {
      head: headers,
      body: data,
      foot: footData,
      showFoot: 'everyPage',
      startY: 22,
      theme: 'grid',
      styles: { 
        fontSize: 8, 
        cellPadding: 3, 
        lineColor: [210, 210, 210], 
        lineWidth: 0.1,
        textColor: [80, 80, 80]
      },
      headStyles: { 
        fillColor: [204, 204, 204], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold' 
      },
      footStyles: {
        fillColor: [26, 188, 156],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      didParseCell: function(data) {
        if (data.section === 'foot') {
          if (data.column.index === 0) {
            data.cell.styles.halign = 'left';
            data.cell.styles.lineWidth = { top: 0.1, bottom: 0.1, left: 0.1, right: 0 };
          } else if (data.column.index > 0 && data.column.index < 4) {
            data.cell.styles.lineWidth = { top: 0.1, bottom: 0.1, left: 0, right: 0 };
          }
        }
      }
    });
    
    doc.save("Collection_Reports.pdf");
  };

  const fetchReport = async (overrideParams = null) => {
    if (!token) return;
    
    // Ensure we don't treat React events as overrideParams
    const isOverride = overrideParams && typeof overrideParams === 'object' && !overrideParams.nativeEvent && !overrideParams._reactName && !overrideParams.target;
    const params = isOverride ? overrideParams : {
      from_date: fromDate,
      to_date: toDate,
      bill_no: billNo || null,
      customer_name: customerSearch || null,
      payment_mode: paymentMode || null,
      created_by: createdBy || null
    };

    try {
      const response = await fetch(`${apiConfig.base_url}/reports/collection/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(params)
      });
      const json = await response.json();
      if(json.data) {
        setReportData(json.data);
        setPage(0);
        const cred = json.totals.reduce((sum, row) => sum + parseFloat(row.credit || 0), 0);
        const deb = json.totals.reduce((sum, row) => sum + parseFloat(row.debit || 0), 0);
        setTotals({ credit: cred, debit: deb, cashInHand: cred - deb });
        const updatedModes = [
          { mode: 'Cash', received: 0, refund: 0 },
          { mode: 'Card', received: 0, refund: 0 },
          { mode: 'Google Pay', received: 0, refund: 0 },
          { mode: 'Credit', received: 0, refund: 0 },
          { mode: 'Net Banking', received: 0, refund: 0 },
          { mode: 'Phone Pe', received: 0, refund: 0 },
          { mode: 'Paytm', received: 0, refund: 0 },
          { mode: 'Amazon Pay', received: 0, refund: 0 },
          { mode: 'UPI', received: 0, refund: 0 },
          { mode: 'Cheque', received: 0, refund: 0 },
          { mode: 'Insurance', received: 0, refund: 0 },
        ];
        json.totals.forEach(t => {
          const rawMode = (t.payment_mode || '').toLowerCase().replace(/\s+/g, '');
          let targetName = null;
          if (rawMode === 'cash') targetName = 'Cash';
          else if (rawMode === 'card' || rawMode === 'creditcard' || rawMode === 'debitcard') targetName = 'Card';
          else if (rawMode === 'googlepay' || rawMode === 'google' || rawMode === 'gpay') targetName = 'Google Pay';
          else if (rawMode === 'credit') targetName = 'Credit';
          else if (rawMode === 'netbanking') targetName = 'Net Banking';
          else if (rawMode === 'phonepe') targetName = 'Phone Pe';
          else if (rawMode === 'paytm') targetName = 'Paytm';
          else if (rawMode === 'amazonpay' || rawMode === 'amazon') targetName = 'Amazon Pay';
          else if (rawMode === 'upi') targetName = 'UPI';
          else if (rawMode === 'cheque') targetName = 'Cheque';
          else if (rawMode === 'insurance') targetName = 'Insurance';

          if (targetName) {
            const mode = updatedModes.find(m => m.mode === targetName);
            if (mode) {
              mode.received += parseFloat(t.credit || 0);
              mode.refund += parseFloat(t.debit || 0);
            }
          }
        });
        setPaymentModes(updatedModes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyFilter = () => {
    setPage(0);
    fetchReport();
  };

  const handleReset = () => {
    setDateFilter('Today');
    setPage(0);
    setSize(10);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setFromDate(todayStr);
    setToDate(todayStr);
    setBillNo('');
    setCustomerSearch('');
    setCustomerSearchText('');
    setPaymentMode('');
    setCreatedBy('');
    setCreatedBySearchText('');
    
    fetchReport({
      from_date: todayStr,
      to_date: todayStr,
      bill_no: null,
      customer_name: null,
      payment_mode: null,
      created_by: null
    });
  };
  
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isCreatedByOpen, setIsCreatedByOpen] = useState(false);
  const [focusedCustomerIndex, setFocusedCustomerIndex] = useState(-1);

  const [createdBySearchText, setCreatedBySearchText] = useState('');
  const [createdByOptions, setCreatedByOptions] = useState([]);
  const [focusedCreatedByIndex, setFocusedCreatedByIndex] = useState(-1);
  
  useEffect(() => {
    fetchReport();
  }, [token]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!token) return;
      if (createdBySearchText.trim().length < 2) {
        setCreatedByOptions([]);
        setFocusedCreatedByIndex(-1);
        return;
      }
      try {
        const res = await fetch(`${apiConfig.base_url}/reports/collection/search-users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query: createdBySearchText })
        });
        const json = await res.json();
        if (json.data) {
          setCreatedByOptions(json.data);
          setFocusedCreatedByIndex(-1);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [createdBySearchText, token]);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!token) return;
      if (customerSearchText.trim().length < 2) {
        setCustomerOptions([]);
        setFocusedCustomerIndex(-1);
        return;
      }
      try {
        const res = await fetch(`${apiConfig.base_url}/reports/collection/search-customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ query: customerSearchText })
        });
        const json = await res.json();
        if (json.data) {
          setCustomerOptions(json.data);
          setFocusedCustomerIndex(-1);
        }
      } catch (err) {
        console.error(err);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [customerSearchText, token]);

  const [activePaymentRowIndex, setActivePaymentRowIndex] = useState(-1);
  const [paymentModes, setPaymentModes] = useState([
    { mode: 'Cash', received: 0, refund: 0 },
    { mode: 'Card', received: 0, refund: 0 },
    { mode: 'Google Pay', received: 0, refund: 0 },
    { mode: 'Credit', received: 0, refund: 0 },
    { mode: 'Net Banking', received: 0, refund: 0 },
    { mode: 'Phone Pe', received: 0, refund: 0 },
    { mode: 'Paytm', received: 0, refund: 0 },
    { mode: 'Amazon Pay', received: 0, refund: 0 },
    { mode: 'UPI', received: 0, refund: 0 },
    { mode: 'Cheque', received: 0, refund: 0 },
    { mode: 'Insurance', received: 0, refund: 0 },
  ]);

  return (
    <div className="bg-white font-sans text-[#333] min-h-screen">
      {/* Top Header Bar */}
      <div className="px-5 pt-[15px] mb-5">

        <h3 className="text-[25.2px] font-medium text-[#323F52] uppercase m-0 tracking-normal mb-[7.2px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
          COLLECTION REPORT
        </h3>
      </div>

      <div className="px-5">
        {/* Filters Section */}
        <div className="border border-[#dee2e6] bg-white rounded-[3px] shadow-sm mb-[24px] p-[12px] mt-[14px]">
          {/* Header */}
          <div className="patients-filter-title flex items-center gap-[6px]" style={{ margin: '0px 0px 8px', color: '#212529', fontFamily: 'Arial, sans-serif', fontSize: '14px', fontWeight: 'bold' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#212529]"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            <span>Filters</span>
          </div>

          <div className="grid grid-cols-12 gap-y-[15px] gap-x-[15px]">
            
            {/* Row 1 Col 1: Customer Name */}
            <div className="col-span-3 relative">
              <label className="block text-[14px] text-[#212529] font-semibold mb-[4px] h-[20px] leading-[20px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Customer Name</label>
              <div 
                className={`w-full bg-white cursor-pointer relative flex items-center justify-between border border-[#dee2e6] focus:outline-none focus:border-[#80bdff] focus:shadow-[0_0_0_0.2rem_rgba(0,123,255,0.25)] transition-shadow ${isCustomerOpen ? 'border-[#80bdff] shadow-[0_0_0_0.2rem_rgba(0,123,255,0.25)]' : ''}`}
                tabIndex={0}
                style={{ 
                  height: '34.4px', 
                  padding: '4px 10.8px',
                  borderRadius: isCustomerOpen ? '3px 3px 0 0' : '3px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}
                onClick={() => setIsCustomerOpen(!isCustomerOpen)}
              >
                <span className={`text-[14.4px] ${customerSearch ? 'text-[#495057]' : 'text-[#adb5bd]'}`}>
                  {customerSearch || 'Search Customer Name'}
                </span>
                <div className="flex items-center gap-[6px]">
                  {customerSearch && (
                    <span className="text-[16px] text-[#999] hover:text-[#333] leading-none cursor-pointer" onClick={(e) => { e.stopPropagation(); setCustomerSearch(''); setCustomerSearchText(''); setIsCustomerOpen(false); }} style={{ marginTop: '-2px' }}>×</span>
                  )}
                  <svg viewBox="0 0 24 24" width="8" height="8" fill="#666" style={{ transform: isCustomerOpen ? 'none' : 'rotate(180deg)' }}>
                    <polygon points="12,6 4,18 20,18" />
                  </svg>
                </div>
              </div>
              {isCustomerOpen && (
                <div 
                  className="absolute left-0 right-0 bg-white z-50"
                  style={{ 
                    border: '1px solid #dee2e6', 
                    borderTop: 'none',
                    borderRadius: '0 0 3px 3px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                >
                  <div style={{ padding: '4px' }}>
                    <input 
                      type="text" 
                      className="w-full outline-none text-[14.4px] text-[#495057]"
                      style={{ 
                        border: '1px solid black', 
                        height: '28px', 
                        padding: '4px 8px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                      }}
                      value={customerSearchText}
                      onChange={e => setCustomerSearchText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setFocusedCustomerIndex(prev => prev < customerOptions.length - 1 ? prev + 1 : prev);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setFocusedCustomerIndex(prev => prev > 0 ? prev - 1 : 0);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (focusedCustomerIndex >= 0 && focusedCustomerIndex < customerOptions.length) {
                            setCustomerSearch(customerOptions[focusedCustomerIndex].customer_name);
                            setIsCustomerOpen(false);
                          }
                        }
                      }}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  {customerSearchText.length < 2 ? (
                    <div 
                      className="text-[14.4px] text-[#495057]"
                      style={{ 
                        padding: '4px 8px 8px 8px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                      }}
                    >
                      Please enter 2 or more characters
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {customerOptions.map((opt, idx) => (
                        <div 
                          key={idx}
                          ref={el => {
                            if (el && focusedCustomerIndex === idx) {
                              el.scrollIntoView({ block: 'nearest' });
                            }
                          }}
                          className={`cursor-pointer hover:bg-[#4285f4] hover:text-white ${focusedCustomerIndex === idx ? 'bg-[#4285f4] text-white' : 'text-[#495057]'}`}
                          style={{
                            padding: '6px 8px',
                            fontSize: '14.4px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            transition: 'background-color 0.1s ease, color 0.1s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomerSearch(opt.customer_name);
                            setIsCustomerOpen(false);
                          }}
                        >
                          {opt.customer_name} - {opt.phone}
                        </div>
                      ))}
                      {customerOptions.length === 0 && (
                        <div className="text-[14.4px] text-[#495057] p-[8px]">
                          No matches found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Row 1 Col 2: Bill No */}
            <div className="col-span-3">
              <label className="block text-[14px] text-[#212529] font-semibold mb-[4px] h-[20px] leading-[20px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Bill No</label>
              <input type="text" placeholder="Search Bill No" value={billNo} onChange={e => setBillNo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleApplyFilter(); }} className="w-full border border-[#dee2e6] rounded-[3px] py-[4px] px-[10.8px] h-[34.4px] text-[14.4px] text-[#868e96] placeholder-[#868e96] outline-none focus:border-[#80bdff] focus:shadow-[0_0_0_0.2rem_rgba(0,123,255,0.25)] transition-shadow" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }} />
            </div>

            {/* Row 1 Col 3: Payment Mode */}
            <div className="col-span-3">
              <label className="block text-[14px] text-[#212529] font-semibold mb-[4px] h-[20px] leading-[20px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Payment Mode</label>
              <div className="relative">
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleApplyFilter(); }} className="w-full border border-[#dee2e6] rounded-[3px] py-[4px] pl-[10.8px] pr-[24px] h-[34.4px] text-[14.4px] text-[#868e96] bg-white outline-none focus:border-[#80bdff] focus:shadow-[0_0_0_0.2rem_rgba(0,123,255,0.25)] transition-shadow appearance-none" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                  <option value="">Select Here</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Google Pay">Google Pay</option>
                  <option value="PhonePe">PhonePe</option>
                  <option value="Credit">Credit</option>
                  <option value="Amazon Pay">Amazon Pay</option>
                  <option value="Paytm">Paytm</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="UPI">UPI</option>
                </select>
                <div className="absolute right-[8px] top-[10px] pointer-events-none">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M4 6L0 0H8L4 6Z" fill="#888888"/></svg>
                </div>
              </div>
            </div>

            {/* Row 1 Col 4: Created By */}
            <div className="col-span-3 relative">
              <label className="block text-[14px] text-[#212529] font-semibold mb-[4px] h-[20px] leading-[20px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Created By</label>
              <div 
                className={`w-full bg-white cursor-pointer relative flex items-center justify-between border border-[#dee2e6] focus:outline-none focus:border-[#80bdff] focus:shadow-[0_0_0_0.2rem_rgba(0,123,255,0.25)] transition-shadow ${isCreatedByOpen ? 'border-[#80bdff] shadow-[0_0_0_0.2rem_rgba(0,123,255,0.25)]' : ''}`}
                tabIndex={0}
                style={{ 
                  height: '34.4px', 
                  padding: '4px 10.8px',
                  borderRadius: isCreatedByOpen ? '3px 3px 0 0' : '3px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}
                onClick={() => setIsCreatedByOpen(!isCreatedByOpen)}
              >
                <span className={`text-[14.4px] ${createdBy ? 'text-[#495057]' : 'text-[#adb5bd]'}`}>
                  {createdBy || 'Select Here'}
                </span>
                <div className="flex items-center gap-[6px]">
                  {createdBy && (
                    <span className="text-[16px] text-[#999] hover:text-[#333] leading-none cursor-pointer" onClick={(e) => { e.stopPropagation(); setCreatedBy(''); setCreatedBySearchText(''); setIsCreatedByOpen(false); }} style={{ marginTop: '-2px' }}>×</span>
                  )}
                  <svg viewBox="0 0 24 24" width="8" height="8" fill="#666" style={{ transform: isCreatedByOpen ? 'none' : 'rotate(180deg)' }}>
                    <polygon points="12,6 4,18 20,18" />
                  </svg>
                </div>
              </div>
              {isCreatedByOpen && (
                <div 
                  className="absolute left-0 right-0 bg-white z-50"
                  style={{ 
                    border: '1px solid #dee2e6', 
                    borderTop: 'none',
                    borderRadius: '0 0 3px 3px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                >
                  <div style={{ padding: '4px' }}>
                    <input 
                      type="text" 
                      className="w-full outline-none text-[14.4px] text-[#495057]"
                      style={{ 
                        border: '1px solid black', 
                        height: '28px', 
                        padding: '4px 8px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                      }}
                      value={createdBySearchText}
                      onChange={e => setCreatedBySearchText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setFocusedCreatedByIndex(prev => prev < createdByOptions.length - 1 ? prev + 1 : prev);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setFocusedCreatedByIndex(prev => prev > 0 ? prev - 1 : 0);
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (focusedCreatedByIndex >= 0 && focusedCreatedByIndex < createdByOptions.length) {
                            setCreatedBy(createdByOptions[focusedCreatedByIndex].name);
                            setIsCreatedByOpen(false);
                          }
                        }
                      }}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  {createdBySearchText.length < 2 ? (
                    <div 
                      className="text-[14.4px] text-[#495057]"
                      style={{ 
                        padding: '4px 8px 8px 8px',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                      }}
                    >
                      Please enter 2 or more characters
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {createdByOptions.map((opt, idx) => (
                        <div 
                          key={idx}
                          ref={el => {
                            if (el && focusedCreatedByIndex === idx) {
                              el.scrollIntoView({ block: 'nearest' });
                            }
                          }}
                          className={`cursor-pointer hover:bg-[#4285f4] hover:text-white ${focusedCreatedByIndex === idx ? 'bg-[#4285f4] text-white' : 'text-[#495057]'}`}
                          style={{
                            padding: '6px 8px',
                            fontSize: '14.4px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            transition: 'background-color 0.1s ease, color 0.1s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCreatedBy(opt.name);
                            setIsCreatedByOpen(false);
                          }}
                        >
                          {opt.name}
                        </div>
                      ))}
                      {createdByOptions.length === 0 && (
                        <div className="text-[14.4px] text-[#495057] p-[8px]">
                          No matches found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Row 2 Col 1: Date Filter */}
            <div className="col-span-2">
              <label className="block text-[14px] text-[#212529] font-semibold mb-[4px] h-[20px] leading-[20px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Date Filter</label>
              <div className="relative">
                <select id="selector" value={dateFilter} onChange={handleDateFilterChange} className="w-full border border-[#dee2e6] rounded-[3px] py-[4px] pl-[10.8px] pr-[24px] h-[34.4px] text-[14.4px] text-[#495057] bg-white outline-none focus:border-[#80bdff] focus:shadow-[0_0_0_0.2rem_rgba(0,123,255,0.25)] transition-shadow appearance-none" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Current Month">Current Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Custom Date">Custom Date</option>
                </select>
                <div className="absolute right-[8px] top-[10px] pointer-events-none">
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M4 6L0 0H8L4 6Z" fill="#888888"/></svg>
                </div>
              </div>
            </div>

            {/* Row 2 Col 2: From Date */}
            <div className="col-span-2">
              <label className="block text-[14px] text-[#212529] font-semibold mb-[4px] h-[20px] leading-[20px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>From Date</label>
              <input id="fdate" type={dateFilter === 'Custom Date' ? 'date' : 'text'} value={dateFilter === 'Custom Date' ? fromDate : fromDate.split('-').reverse().join('-')} onChange={e => setFromDate(e.target.value)} disabled={dateFilter !== 'Custom Date'} className={`w-full border border-[#dee2e6] rounded-[3px] py-[4px] px-[10.8px] h-[34.4px] text-[14.4px] text-[#495057] outline-none focus:border-[#80bdff] focus:shadow-[0_0_0_0.2rem_rgba(0,123,255,0.25)] transition-shadow ${dateFilter === 'Custom Date' ? 'bg-white' : 'bg-[#e9ecef]'}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }} />
            </div>

            {/* Row 2 Col 3: To Date */}
            <div className="col-span-2">
              <label className="block text-[14px] text-[#212529] font-semibold mb-[4px] h-[20px] leading-[20px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>To Date</label>
              <input id="tdate" type={dateFilter === 'Custom Date' ? 'date' : 'text'} value={dateFilter === 'Custom Date' ? toDate : toDate.split('-').reverse().join('-')} onChange={e => setToDate(e.target.value)} disabled={dateFilter !== 'Custom Date'} className={`w-full border border-[#dee2e6] rounded-[3px] py-[4px] px-[10.8px] h-[34.4px] text-[14.4px] text-[#495057] outline-none focus:border-[#80bdff] focus:shadow-[0_0_0_0.2rem_rgba(0,123,255,0.25)] transition-shadow ${dateFilter === 'Custom Date' ? 'bg-white' : 'bg-[#e9ecef]'}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }} />
            </div>
            
            {/* Row 2 Col 4: Action Buttons */}
            <div className="col-span-6 flex items-end gap-[9px] h-[58.4px]">
              <ApplyFilterButton onClick={handleApplyFilter} />
              
              <ResetButton onClick={handleReset} />
            </div>

          </div>
        </div>

        {/* Pagination & Export Bar */}
        <div className="flex items-center mb-[15px] pt-[8px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
          
          <PaginationControls page={page} setPage={setPage} size={size} totalCount={reportData.length} />

          {/* Page Size Select */}
          <div className="relative" style={{ marginLeft: '24px' }}>
            <select
              value={size}
              onChange={(e) => {
                setSize(parseInt(e.target.value));
                setPage(0);
              }}
              className="border border-[#dee2e6] rounded-[3px] text-[#212529] outline-none focus:border-[#80bdff] focus:shadow-[0_0_0_0.2rem_rgba(0,123,255,0.25)] transition-shadow appearance-none bg-white"
              style={{ height: '34.4px', width: '61.6px', padding: '5.4px 25.2px 5.4px 10.8px', fontSize: '14.4px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="75">75</option>
              <option value="100">100</option>
              <option value="1000000">All</option>
            </select>
            <div className="absolute pointer-events-none flex flex-col gap-[2px]" style={{ right: '8px', top: '14.5px' }}>
              <svg width="6" height="4" viewBox="0 0 6 4" fill="#212529"><path d="M3 0L6 4H0L3 0Z"/></svg>
              <svg width="6" height="4" viewBox="0 0 6 4" fill="#212529"><path d="M3 4L0 0H6L3 4Z"/></svg>
            </div>
          </div>

          {/* Page Num Select */}
          <div className="relative" style={{ marginLeft: '25px' }}>
            <select
              value={page}
              onChange={(e) => setPage(parseInt(e.target.value))}
              className="border border-[#dee2e6] rounded-[3px] text-[#212529] outline-none focus:border-[#80bdff] focus:shadow-[0_0_0_0.2rem_rgba(0,123,255,0.25)] transition-shadow appearance-none bg-white"
              style={{ height: '34.4px', width: '52.8px', padding: '5.4px 21.6px 5.4px 10.8px', fontSize: '14.4px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
            >
              {Array.from({ length: Math.max(1, Math.ceil(reportData.length / size)) }, (_, i) => (
                <option key={i} value={i}>{i + 1}</option>
              ))}
            </select>
            <div className="absolute pointer-events-none flex flex-col gap-[2px]" style={{ right: '8px', top: '14.5px' }}>
              <svg width="6" height="4" viewBox="0 0 6 4" fill="#212529"><path d="M3 0L6 4H0L3 0Z"/></svg>
              <svg width="6" height="4" viewBox="0 0 6 4" fill="#212529"><path d="M3 4L0 0H6L3 4Z"/></svg>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center ml-auto" style={{ gap: '4px' }}>
            <ToCsvButton onClick={handleExportCSV} />
            <ToPdfButton onClick={handleExportPDF} />
          </div>
        </div>

        {/* Main Table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-[13px] border-collapse border border-[#dee2e6] bg-white text-center" id="table_id">
          <thead className="bg-[#EEEEEE] text-[#212529] border-b border-[#dee2e6] text-[12.96px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            <tr>
              <th className="p-[4px] text-center font-bold border-r border-[#dee2e6] w-[7%]" style={{ marginBottom: '18px' }}><div className="tablesorter-header-inner" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>S.No</div></th>
              <th className="p-[4px] text-center font-bold border-r border-[#dee2e6] w-[17%]" style={{ marginBottom: '18px' }}><div className="tablesorter-header-inner" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Date</div></th>
              <th className="p-[4px] text-center font-bold border-r border-[#dee2e6] w-[7%]" style={{ marginBottom: '18px' }}><div className="tablesorter-header-inner" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Bill No</div></th>
              <th className="p-[4px] text-center font-bold border-r border-[#dee2e6] w-[14%]" style={{ marginBottom: '18px' }}><div className="tablesorter-header-inner" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Customer Name</div></th>
              <th className="p-[4px] text-center font-bold border-r border-[#dee2e6] w-[11%]" style={{ marginBottom: '18px' }}><div className="tablesorter-header-inner" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Received(₹)</div></th>
              <th className="p-[4px] text-center font-bold border-r border-[#dee2e6] w-[9%]" style={{ marginBottom: '18px' }}><div className="tablesorter-header-inner" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Refund(₹)</div></th>
              <th className="p-[4px] text-center font-bold border-r border-[#dee2e6] w-[23%]" style={{ marginBottom: '18px' }}><div className="tablesorter-header-inner" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Payment Mode</div></th>
              <th className="p-[4px] text-center font-bold w-[12%]" style={{ marginBottom: '18px' }}><div className="tablesorter-header-inner" style={{ padding: '4px', fontFamily: 'Arial, sans-serif' }}>Created By</div></th>
            </tr>
          </thead>
          <tbody>
            {reportData.length === 0 ? (
               <tr className="bg-white text-[#212529] border-b border-[#dee2e6] text-[12.96px]">
                 <td colSpan="8" className="p-[10.8px] text-center border-r border-[#dee2e6]">No Records Found.</td>
               </tr>
            ) : (size === 1000000 ? reportData : reportData.slice(page * size, (page + 1) * size)).map((row, idx) => (
            <tr key={idx} className="bg-white hover:bg-[#f1f5f9] transition-colors duration-150 text-[#212529] border-b border-[#dee2e6] text-[12.96px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
              <td className="p-[10.8px] text-right border-r border-[#dee2e6]">{page * size + idx + 1}</td>
              <td className="p-[10.8px] text-left border-r border-[#dee2e6]">{formatDateTime(row.receipt_date)}</td>
              <td className="p-[10.8px] text-right border-r border-[#dee2e6]">{row.invoice_no}</td>
              <td className="p-[10.8px] text-left border-r border-[#dee2e6] text-[#212529]" style={{ fontSize: '12.96px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{row.customer_name}</td>
              <td className="p-[10.8px] text-right border-r border-[#dee2e6]">{formatCurrency(row.credit)}</td>
              <td className="p-[10.8px] text-right border-r border-[#dee2e6]">{formatCurrency(row.debit)}</td>
              <td className="p-[10.8px] text-left border-r border-[#dee2e6]">{row.payment_mode}</td>
              <td className="p-[10.8px] text-left">{row.createdby}</td>
            </tr>
            ))}
          </tbody>
          {reportData.length > 0 && (
            <tfoot className="bg-[#F9F9F9] font-bold text-[#212529] text-[12.96px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            <tr className="border-b border-[#dee2e6]">
              <td colSpan="4" className="p-[10.8px] text-right border-r border-[#dee2e6]" style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px' }}>Grand total</td>
              <td className="p-[10.8px] text-right border-r border-[#dee2e6]">{formatCurrency(totals.credit)}</td>
              <td className="p-[10.8px] text-right border-r border-[#dee2e6]">{formatCurrency(totals.debit)}</td>
              <td colSpan="2" className="p-[10.8px]"></td>
            </tr>
            <tr className="border-b border-[#dee2e6]">
              <td colSpan="4" className="p-[10.8px] text-right border-r border-[#dee2e6]" style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px' }}>Cash in Hand</td>
              <td className="p-[10.8px] text-right border-r border-[#dee2e6]">{formatCurrency(totals.cashInHand)}</td>
              <td className="p-[10.8px] text-right border-r border-[#dee2e6]"></td>
              <td colSpan="2" className="p-[10.8px]"></td>
            </tr>
            </tfoot>
          )}
        </table>
      </div>

        {/* Payment Mode Summary Table */}
        <div className="overflow-x-auto w-[57%] mb-8 outline-none" tabIndex={0} onKeyDown={handlePaymentTableKeyDown}>
          <table className="w-full border-collapse border border-[#dee2e6] rounded-[3px]">
            <thead>
              <tr className="bg-white text-[#212529] border-b border-[#dee2e6]">
                <th className="p-[10.8px] text-left border-r border-[#dee2e6] w-[50%] font-bold text-[12.96px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Payment Mode</th>
                <th className="p-[10.8px] text-center border-r border-[#dee2e6] w-[25%] font-bold text-[12.96px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Received(₹)</th>
                <th className="p-[10.8px] text-center w-[25%] font-bold text-[12.96px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>Refund(₹)</th>
              </tr>
            </thead>
            <tbody>
              {paymentModes.map((row, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => setActivePaymentRowIndex(idx)}
                  className={`border-b border-[#dee2e6] last:border-0 cursor-pointer ${activePaymentRowIndex === idx ? 'bg-[#007bff] text-white' : 'bg-white text-[#212529] hover:bg-[#007bff] hover:text-[#212529]'}`}
                >
                  <td className="p-[10.8px] text-left border-r border-[#dee2e6] text-[12.96px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{row.mode}</td>
                  <td className="p-[10.8px] text-right border-r border-[#dee2e6] text-[12.96px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{row.received}</td>
                  <td className="p-[10.8px] text-right text-[12.96px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{row.refund}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
      
      {/* Footer */}
      <div className="text-center text-[11px] text-[#999999] py-4 mt-8">
        Copyright © NIGSOFT Private Ltd
      </div>
    </div>
  );
}