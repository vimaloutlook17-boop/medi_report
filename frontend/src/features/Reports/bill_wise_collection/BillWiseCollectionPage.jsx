import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { useAuth } from '../../../AuthContext';
import PaginationControls from '../../../components/PaginationControls';
import { ApplyFilterButton, ResetButton } from '../../../components/FilterButtons';
import ToPdfButton from '../../../components/ToPdfButton';
import ToCsvButton from '../../../components/ToCsvButton';
import { apiConfig } from '../../../config';

export default function BillWiseCollectionPage() {
  const { token, refreshAuthToken, isTokenExpired } = useAuth();
  
  const getValidToken = async () => {
    let t = token || localStorage.getItem('jwt_token');
    if (!t || (isTokenExpired && isTokenExpired(t))) {
      if (refreshAuthToken) {
        t = await refreshAuthToken();
      }
    }
    return t;
  };
  
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const [dateFilter, setDateFilter] = useState('Custom Date');
  const [billNoDisplay, setBillNoDisplay] = useState('');
  const selectedBillNo = React.useRef('');
  const [billSearchQuery, setBillSearchQuery] = useState('');
  const [billNoOptions, setBillNoOptions] = useState([]);
  const [billFocusedIndex, setBillFocusedIndex] = useState(-1);
  const [patientName, setPatientName] = useState('');
  const [patientNameDisplay, setPatientNameDisplay] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [patientNameOptions, setPatientNameOptions] = useState([]);
  const [customerFocusedIndex, setCustomerFocusedIndex] = useState(-1);
  const [customerDropOpen, setCustomerDropOpen] = useState(false);
  const customerDropRef = React.useRef(null);
  const [billDropOpen, setBillDropOpen] = useState(false);
  const billDropRef = React.useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (customerDropRef.current && !customerDropRef.current.contains(e.target)) {
        setCustomerDropOpen(false);
      }
      if (billDropRef.current && !billDropRef.current.contains(e.target)) {
        setBillDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const [statusFilter, setStatusFilter] = useState('All');
  const [fromDate, setFromDate] = useState('2025-01-01');
  const [toDate, setToDate] = useState(todayStr);
  
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({ total_bill_amount: 0, total_collected_amount: 0 });
  const [modePayments, setModePayments] = useState([]);
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailEmail, setMailEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRow, setActiveRow] = useState(-1);

  // Keyboard navigation for active row
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (data.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveRow(prev => Math.min(prev + 1, data.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveRow(prev => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [data.length]);

  const formatDateTime = (dtStr) => {
    if (!dtStr) return '';
    const date = new Date(dtStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  const calculateDateRange = (filter) => {
    const today = new Date();
    let fDate = new Date();
    let tDate = new Date();

    switch (filter) {
      case 'Today':
        break;
      case 'Yesterday':
        fDate.setDate(today.getDate() - 1);
        tDate.setDate(today.getDate() - 1);
        break;
      case 'Last 7 Days':
        fDate.setDate(today.getDate() - 6);
        break;
      case 'Current Month':
        fDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'Last Month':
        fDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        tDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'Custom Date':
        return;
      default:
        break;
    }
    
    const fd = `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, '0')}-${String(fDate.getDate()).padStart(2, '0')}`;
    const td = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;
    setFromDate(fd);
    setToDate(td);
  };

  useEffect(() => {
    if (dateFilter !== 'Custom Date') {
      calculateDateRange(dateFilter);
    }
  }, [dateFilter]);

  const searchBills = async (query) => {
    if (!query || query.trim().length === 0) {
      setBillNoOptions([]);
      return;
    }
    try {
      const activeToken = await getValidToken();
      if (!activeToken) return;
      const response = await fetch(`${apiConfig.base_url}/reports/bill-wise-collection/search-bills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ query: query.trim() })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setBillNoOptions(result.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const searchCustomers = async (query) => {
    if (!query || query.trim().length === 0) {
      setPatientNameOptions([]);
      return;
    }
    try {
      const activeToken = await getValidToken();
      if (!activeToken) return;
      const response = await fetch(`${apiConfig.base_url}/reports/bill-wise-collection/search-customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ query: query.trim() })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setPatientNameOptions(result.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ---- Applied Filters State (the ONLY source of truth for fetching) ----
  // When Apply Filter is clicked, we store the current filter values here.
  // The useEffect below watches this state and fetches whenever it changes.
  // This eliminates ALL closure/ref/timing issues.
  const [appliedFilters, setAppliedFilters] = useState({
    billNo: '',
    patientName: '',
    status: 'All',
    fromDate: '2025-01-01',
    toDate: todayStr
  });

  const fetchReport = async (filters) => {
    setLoading(true);
    try {
      let activeToken = await getValidToken();
      if (!activeToken && refreshAuthToken) {
        activeToken = await refreshAuthToken();
      }
      if (!activeToken) {
        console.warn("[BWC] No active token available");
        setLoading(false);
        return;
      }
      console.log("[BWC] Fetching with filters:", filters);
      let response = await fetch(`${apiConfig.base_url}/reports/bill-wise-collection/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({
            from_date: filters.fromDate,
            to_date: filters.toDate,
            bill_no: filters.billNo || null,
            customer_name: filters.patientName || null,
            status: filters.status !== 'All' ? filters.status : null
          })
      });
      if (response.status === 401 && refreshAuthToken) {
        activeToken = await refreshAuthToken();
        if (activeToken) {
          response = await fetch(`${apiConfig.base_url}/reports/bill-wise-collection/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeToken}`
            },
            body: JSON.stringify({
                from_date: filters.fromDate,
                to_date: filters.toDate,
                bill_no: filters.billNo || null,
                customer_name: filters.patientName || null,
                status: filters.status !== 'All' ? filters.status : null
              })
          });
        }
      }
      const result = await response.json();
      console.log("[BWC] Response received:", result);
      if (result.status === 'success' && result.data) {
        setData(result.data.data || []);
        setTotalElements((result.data.data || []).length);
        setTotals(result.data.totals || {});
        setModePayments(result.data.mode_payments || []);
      }
    } catch (error) {
      console.error("Failed to fetch bill wise collection report", error);
    }
    setLoading(false);
  };

  // Single useEffect — runs whenever page, size, token, OR appliedFilters changes
  useEffect(() => {
    fetchReport(appliedFilters);
  }, [page, size, token, appliedFilters]);

  const handleApplyFilter = () => {
    const effectiveBillNo = (billNoDisplay ? billNoDisplay.split(' - ')[0].trim() : (billSearchQuery || '')).trim();
    const effectiveCustomer = (patientNameDisplay || patientName || customerSearchQuery || '').trim();
    const newFilters = { billNo: effectiveBillNo, patientName: effectiveCustomer, status: statusFilter, fromDate, toDate };
    console.log('[BWC] billNo:', effectiveBillNo, 'customer:', effectiveCustomer);
    setPage(0);
    setAppliedFilters(newFilters);
    fetchReport(newFilters);
  };

  const [mailSending, setMailSending] = useState(false);

  const handleSendMail = async () => {
    if (!mailEmail || !mailEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    setMailSending(true);
    try {
      const activeToken = await getValidToken();
      const response = await fetch(`${apiConfig.base_url}/reports/bill-wise-collection/send-mail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${activeToken || token}` },
        body: JSON.stringify({
          to_email: mailEmail,
          from_date: appliedFilters.fromDate,
          to_date: appliedFilters.toDate,
          bill_no: appliedFilters.billNo || null,
          customer_name: appliedFilters.patientName || null,
          status: appliedFilters.status !== 'All' ? appliedFilters.status : null
        })
      });
      const result = await response.json();
      if (result.status === 'success') {
        alert(`Email sent successfully to ${mailEmail}`);
        setShowMailModal(false);
        setMailEmail('');
      } else {
        alert('Failed to send email: ' + (result.detail || 'Unknown error'));
      }
    } catch (e) {
      alert('Error sending email: ' + e.message);
    }
    setMailSending(false);
  };

  const handleReset = () => {
    setDateFilter('Custom Date');
    setFromDate('2025-01-01');
    setToDate(todayStr);
    setBillNoDisplay('');
    selectedBillNo.current = '';
    setBillSearchQuery('');
    setBillNoOptions([]);
    setBillDropOpen(false);
    setPatientName('');
    setPatientNameDisplay('');
    setCustomerSearchQuery('');
    setPatientNameOptions([]);
    setStatusFilter('All');
    setPage(0);
    const resetFilters = { billNo: '', patientName: '', status: 'All', fromDate: '2025-01-01', toDate: todayStr };
    setAppliedFilters(resetFilters);
    fetchReport(resetFilters);
  };

  const handleExportExcel = () => {
    const wsData = [
      [
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
    ];

    data.forEach((row, idx) => {
      const pName = row.customer_name || '';
      const taxAmt = parseFloat(row.subtotal || 0).toFixed(2);
      const bAmount = parseFloat(row.bill_amount || 0).toFixed(2);
      const adv = (parseFloat(row.advance || 0) - parseFloat(row.changeamt || 0)).toFixed(2);
      const disc = parseFloat(row.total_discount || 0).toFixed(2);
      const retItem = row.return_item_amount ? String(row.return_item_amount) : '0';
      const refVal = row.return_value ? parseFloat(row.return_value).toFixed(2) : '0.00';
      const bal = parseFloat(row.balance || 0).toFixed(2);

      wsData.push([
        idx + 1,
        formatDateTime(row.bill_date),
        row.invoice_no || row.bill_id || '',
        pName,
        taxAmt,
        bAmount,
        adv,
        disc,
        retItem,
        refVal,
        bal,
        row.status || ''
      ]);
    });

    // Grand total row
    const sumSub = parseFloat(totals.sum_subtotal || 0).toFixed(2);
    const sumBill = parseFloat(totals.total_bill_amount || totals.sum_grand_total || 0).toFixed(2);
    const sumRecv = parseFloat(totals.sum_received || 0).toFixed(2);
    const sumBal = parseFloat(totals.sum_balance || 0).toFixed(2);

    wsData.push([
      "Grand total",
      "",
      "",
      "",
      sumSub,
      sumBill,
      sumRecv,
      "",
      "",
      "",
      sumBal,
      ""
    ]);

    // Credit / Debit header row
    wsData.push([
      "",
      "",
      "",
      "",
      "Credit",
      "",
      "Debit",
      "",
      "",
      "",
      "",
      ""
    ]);

    // Mode payments rows
    const paymentModesList = [
      { label: 'Cash Payments', mode: 'Cash' },
      { label: 'Card  Payments', mode: 'Card' },
      { label: 'Google Pay Payments', mode: 'Google Pay' },
      { label: 'Credit Payments', mode: 'Credit' },
      { label: 'PhonePe Payments', mode: 'PhonePe' },
      { label: 'Cheque Payments', mode: 'Cheque' },
      { label: 'Amazon Pay Payments', mode: 'Amazon Pay' },
      { label: 'Paytm Payments', mode: 'Paytm' },
      { label: 'Insurance Payments', mode: 'Insurance' },
      { label: 'Net Banking', mode: 'Net Banking' }
    ];

    paymentModesList.forEach(m => {
      const pm = modePayments.find(p => p.payment_mode === m.mode);
      wsData.push([
        m.label,
        "",
        "",
        "",
        pm && pm.credit ? parseFloat(pm.credit).toFixed(2) : '0.00',
        "",
        pm && pm.debit ? parseFloat(pm.debit).toFixed(2) : '0.00',
        "",
        "",
        "",
        "",
        ""
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 9 },   // S.No
      { wch: 11 },  // Date
      { wch: 10 },  // Bill No
      { wch: 22 },  // Customer Name
      { wch: 22 },  // Taxable Amount (INR)
      { wch: 19 },  // Bill Amount (INR)
      { wch: 24 },  // Amount Received (INR)
      { wch: 17 },  // Discount (INR)
      { wch: 22 },  // Return Amount (INR)
      { wch: 22 },  // Refund Amount (INR)
      { wch: 23 },  // Balance Amount (INR)
      { wch: 12 }   // Status
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "1");
    XLSX.writeFile(wb, "new_purchase_order.xlsx");
  };

  const handleExportCSV = () => {
    const wsData = [
      [
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
    ];

    data.forEach((row, idx) => {
      const pName = row.customer_name || '';
      const taxAmt = parseFloat(row.subtotal || 0).toFixed(2);
      const bAmount = parseFloat(row.bill_amount || 0).toFixed(2);
      const adv = (parseFloat(row.advance || 0) - parseFloat(row.changeamt || 0)).toFixed(2);
      const disc = parseFloat(row.total_discount || 0).toFixed(2);
      const retItem = row.return_item_amount ? String(row.return_item_amount) : '0';
      const refVal = row.return_value ? parseFloat(row.return_value).toFixed(2) : '0.00';
      const bal = parseFloat(row.balance || 0).toFixed(2);

      wsData.push([
        idx + 1,
        formatDateTime(row.bill_date),
        row.invoice_no || row.bill_id || '',
        pName,
        taxAmt,
        bAmount,
        adv,
        disc,
        retItem,
        refVal,
        bal,
        row.status || ''
      ]);
    });

    const sumSub = parseFloat(totals.sum_subtotal || 0).toFixed(2);
    const sumBill = parseFloat(totals.total_bill_amount || totals.sum_grand_total || 0).toFixed(2);
    const sumRecv = parseFloat(totals.sum_received || 0).toFixed(2);
    const sumBal = parseFloat(totals.sum_balance || 0).toFixed(2);

    wsData.push([
      "Grand total",
      "",
      "",
      "",
      sumSub,
      sumBill,
      sumRecv,
      "",
      "",
      "",
      sumBal,
      ""
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "1");
    XLSX.writeFile(wb, "Bill_Wise_Collection.csv");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Bill Wise Collection Report - ${fromDate.split('-').reverse().join('-')} to ${toDate.split('-').reverse().join('-')}`, 14, 15);
    
    const headers = [['S.No', 'Date', 'Bill No', 'Patient Name', 'Bill Amount', 'Amount Received', 'Balance', 'Status']];
    
    const tableData = data.map((row, idx) => {
      const pName = row.customer_name || '';
      const bAmount = parseFloat(row.bill_amount || 0);
      const adv = parseFloat(row.advance || 0) - parseFloat(row.changeamt || 0);
      const bal = parseFloat(row.balance || 0);
      return [
        idx + 1,
        formatDateTime(row.bill_date),
        row.invoice_no || row.bill_id || '',
        pName,
        bAmount.toFixed(2),
        adv.toFixed(2),
        bal.toFixed(2),
        row.status || ''
      ];
    });
    
    const tb = parseFloat(totals.total_bill_amount || totals.sum_grand_total || 0);
    const tc = parseFloat(totals.sum_received || 0);
    const tbal = parseFloat(totals.sum_balance || 0);
    const footData = [
      ['Total', '', '', '', tb.toFixed(2), tc.toFixed(2), tbal.toFixed(2), '']
    ];

    autoTable(doc, {
      head: headers,
      body: tableData,
      foot: footData,
      showFoot: 'lastPage',
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
        fillColor: [245, 245, 245], 
        textColor: [0, 0, 0], 
        fontStyle: 'bold'
      },
      footStyles: { 
        fillColor: [26, 188, 156], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold'
      },
      didParseCell: function(data) {
        if (data.section === 'foot') {
          // Remove all borders in the footer to create a solid green block
          data.cell.styles.lineWidth = 0;
          if (data.column.index === 0) {
            data.cell.styles.halign = 'left';
          }
        }
      }
    });

    doc.save('Bill_Wise_Collection.pdf');
  };

  const paginatedData = data.slice(page * size, (page + 1) * size);

  return (
    <div id="layoutSidenav_content" className="ml-[-216px] pl-[216px] text-[#212529] font-sans text-[12.96px] bg-white min-h-screen">
      <div className="px-[14.4px] pt-[15px]">

        {/* Header */}
        <h3 className="text-[25.2px] font-medium text-[#323F52] mb-[12px] pt-[5px] uppercase">
          BILL WISE COLLECTION
        </h3>

        {/* Filters Box */}
        <div className="border border-[#dee2e6] rounded-[3px] mb-4">
          <div className="px-[14.4px] py-[9.6px] flex items-center gap-1 bg-transparent patients-filter-title" style={{ margin: '0px 0px 8px', color: '#212529', font: '14px Arial, sans-serif' }}>
            <svg className="w-[14px] h-[14px] fill-current" viewBox="0 0 512 512"><path d="M3.9 54.9C10.5 40.9 24.5 32 40 32H472c15.5 0 29.5 8.9 36.1 22.9s4.6 30.5-5.2 42.5L320 320.9V448c0 12.1-6.8 23.2-17.7 28.6s-23.8 4.3-33.5-3l-64-48c-8.1-6-12.8-15.5-12.8-25.6V320.9L9 97.3C-.7 85.4-2.8 68.8 3.9 54.9z"/></svg>
            <span className="font-bold">Filters</span>
          </div>
          <div className="px-[14.4px] pb-[14.4px]">
            <div className="flex flex-wrap items-end mx-[-6px]">
              
              <div className="w-[16.666%] px-[6px] mt-[5px]">
                <label className="block text-[#212529] whitespace-nowrap overflow-hidden text-ellipsis font-bold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '14px', lineHeight: '1.42857', margin: '0px 0px 4px', color: '#212529' }}>Date Filter</label>
                <select 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full border border-[#ccc] rounded-[3px] bg-white outline-none focus:border-[#80bdff] focus:ring-1 focus:ring-[#80bdff] appearance-none"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
                    fontSize: '14.4px', 
                    color: '#495057', 
                    padding: '4px 28px 4px 10.8px', 
                    height: '34.4px',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 448 512\'%3E%3Cpath fill=\'%23495057\' d=\'M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z\'/%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 10.8px center',
                    backgroundSize: '10px'
                  }}
                >
                  <option>Today</option>
                  <option>Yesterday</option>
                  <option>Last 7 Days</option>
                  <option>Current Month</option>
                  <option>Last Month</option>
                  <option>Custom Date</option>
                </select>
              </div>

              <div className="w-[16.666%] px-[6px] mt-[5px]">
                <label className="block text-[#212529] whitespace-nowrap overflow-hidden text-ellipsis font-bold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '14px', lineHeight: '1.42857', margin: '0px 0px 4px', color: '#212529' }}>From Date</label>
                <input 
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  disabled={dateFilter !== 'Custom Date'}
                  className="w-full border border-[#ccc] rounded-[3px] outline-none focus:border-[#80bdff] focus:ring-1 focus:ring-[#80bdff]"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '14.4px', color: '#495057', padding: '4px 10.8px', height: '34.4px', backgroundColor: dateFilter === 'Custom Date' ? '#ffffff' : '#e9ecef' }}
                />
              </div>

              <div className="w-[16.666%] px-[6px] mt-[5px]">
                <label className="block text-[#212529] whitespace-nowrap overflow-hidden text-ellipsis font-bold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '14px', lineHeight: '1.42857', margin: '0px 0px 4px', color: '#212529' }}>To Date</label>
                <input 
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  disabled={dateFilter !== 'Custom Date'}
                  className="w-full border border-[#ccc] rounded-[3px] outline-none focus:border-[#80bdff] focus:ring-1 focus:ring-[#80bdff]"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '14.4px', color: '#495057', padding: '4px 10.8px', height: '34.4px', backgroundColor: dateFilter === 'Custom Date' ? '#ffffff' : '#e9ecef' }}
                />
              </div>

              <div className="w-[16.666%] px-[6px] mt-[5px]">
                <label className="block text-[#212529] whitespace-nowrap overflow-hidden text-ellipsis font-bold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '14px', lineHeight: '1.42857', margin: '0px 0px 4px', color: '#212529' }}>Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-[#ccc] rounded-[3px] bg-white outline-none focus:border-[#80bdff] focus:ring-1 focus:ring-[#80bdff] appearance-none" style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', 
                  fontSize: '14.4px', 
                  color: '#495057', 
                  padding: '4px 28px 4px 10.8px', 
                  height: '34.4px',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 448 512\'%3E%3Cpath fill=\'%23495057\' d=\'M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z\'/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10.8px center',
                  backgroundSize: '10px'
                }}>
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>

              <div className="w-[16.666%] px-[6px] mt-[5px]">
                <label className="block text-[#212529] whitespace-nowrap overflow-hidden text-ellipsis font-bold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '14px', lineHeight: '1.42857', margin: '0px 0px 4px', color: '#212529' }}>Bill No</label>
                <div className="relative w-full" ref={billDropRef}>
                  {/* Trigger button */}
                  <div
                    className="w-full border border-[#ccc] rounded-[3px] bg-white flex items-center justify-between cursor-pointer"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '14.4px', padding: '4px 10.8px', height: '34.4px' }}
                    onClick={() => {
                      setBillDropOpen(o => !o);
                      setBillSearchQuery('');
                      setBillNoOptions([]);
                      setBillFocusedIndex(-1);
                    }}
                  >
                    <span className="truncate pr-[4px]" style={{ color: billNoDisplay ? '#212529' : '#6c757d', fontSize: '14.4px' }}>
                      {billNoDisplay || 'Search Bill No'}
                    </span>
                    <div className="flex items-center gap-[4px] shrink-0">
                      {billNoDisplay && (
                        <span
                          onClick={(e) => { e.stopPropagation(); selectedBillNo.current = ''; setBillNoDisplay(''); setBillSearchQuery(''); setBillNoOptions([]); setBillDropOpen(false); }}
                          className="text-[#6c757d] hover:text-[#212529] font-bold text-[14px] leading-none cursor-pointer"
                        >×</span>
                      )}
                      {billDropOpen
                        ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className="w-[10px] h-[10px]"><path fill="#888" d="M288.66 352H31.34c-17.818 0-26.741-21.543-14.142-34.142l128.66-128.662c7.81-7.81 20.474-7.81 28.284 0l128.66 128.662c12.6 12.599 3.676 34.142-14.142 34.142z"/></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className="w-[10px] h-[10px]"><path fill="#888" d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"/></svg>
                      }
                    </div>
                  </div>
                  {/* Dropdown panel */}
                  {billDropOpen && (
                    <div className="absolute top-[100%] left-0 w-full bg-white border border-[#ccc] z-[999] mt-[1px]" style={{ boxShadow: '0 4px 5px rgba(0,0,0,.15)' }}>
                      <div className="p-[4px]">
                        <input
                          autoFocus
                          type="text"
                          className="w-full border border-[#aaa] outline-none rounded-[3px] p-[4px] h-[30px]"
                          style={{ fontSize: '14.4px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                          value={billSearchQuery}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBillSearchQuery(val);
                            setBillFocusedIndex(-1);
                            if (val.length >= 1) searchBills(val);
                            else setBillNoOptions([]);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') { e.preventDefault(); setBillFocusedIndex(p => Math.min(p + 1, billNoOptions.length - 1)); }
                            else if (e.key === 'ArrowUp') { e.preventDefault(); setBillFocusedIndex(p => Math.max(p - 1, 0)); }
                            else if (e.key === 'Enter') {
                              e.preventDefault();
                                const opt = billNoOptions[billFocusedIndex  ? billFocusedIndex : 0];
                                const display = `${opt.invoice_no}${opt.customer_name ? ` - ${opt.customer_name}` : ''}`;
                                selectedBillNo.current = opt.invoice_no;
                                setBillNoDisplay(display);
                                setBillSearchQuery('');
                                setBillNoOptions([]);
                                setBillFocusedIndex(-1);
                                setBillDropOpen(false);
                            } else if (e.key === 'Escape') { setBillDropOpen(false); }
                          }}
                          placeholder="Search Bill No"
                        />
                      </div>
                      {billSearchQuery.length >= 1 && billNoOptions.length === 0 && (
                        <div className="px-[8px] py-[4px] text-[#212529]" style={{ fontSize: '14.4px' }}>No results found</div>
                      )}
                      {billNoOptions.length > 0 && (
                        <div className="max-h-[200px] overflow-y-auto">
                          {billNoOptions.map((opt, idx) => (
                            <div
                              key={idx}
                              className={`px-[8px] py-[6px] cursor-pointer ${idx === billFocusedIndex ? 'bg-[#007bff] text-white' : 'text-[#212529] hover:bg-[#007bff] hover:text-white'}`}
                              style={{ fontSize: '14.4px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                              onMouseEnter={() => setBillFocusedIndex(idx)}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                const display = `${opt.invoice_no}${opt.customer_name ? ` - ${opt.customer_name}` : ''}`;
                                selectedBillNo.current = opt.invoice_no;
                                setBillNoDisplay(display);
                                setBillSearchQuery('');
                                setBillNoOptions([]);
                                setBillFocusedIndex(-1);
                                setBillDropOpen(false);
                              }}
                            >
                              {opt.invoice_no}{opt.customer_name ? ` - ${opt.customer_name}` : ''}
                            </div>
                          ))}
                        </div>
                      )}
                      {billSearchQuery.length === 0 && (
                        <div className="px-[8px] py-[4px] text-[#6c757d]" style={{ fontSize: '13px' }}>Please enter 1 or more characters</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-[16.666%] px-[6px] mt-[5px]">
                <label className="block text-[#212529] whitespace-nowrap overflow-hidden text-ellipsis font-bold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '14px', lineHeight: '1.42857', margin: '0px 0px 4px', color: '#212529' }}>Customer Name</label>
                <div className="relative w-full" ref={customerDropRef}>
                  {/* Trigger button */}
                  <div
                    className="w-full border border-[#ccc] rounded-[3px] bg-white flex items-center justify-between cursor-pointer"
                    style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', fontSize: '14.4px', padding: '4px 10.8px', height: '34.4px' }}
                    onClick={() => {
                      setCustomerDropOpen(o => !o);
                      setCustomerSearchQuery('');
                      setPatientNameOptions([]);
                      setCustomerFocusedIndex(-1);
                    }}
                  >
                    <span className="truncate pr-[4px]" style={{ color: patientNameDisplay ? '#212529' : '#6c757d', fontSize: '14.4px' }}>
                      {patientNameDisplay || 'Search Customer Name'}
                    </span>
                    <div className="flex items-center gap-[4px] shrink-0">
                      {patientNameDisplay && (
                        <span
                          onClick={(e) => { e.stopPropagation(); setPatientName(''); setPatientNameDisplay(''); setCustomerSearchQuery(''); setPatientNameOptions([]); setCustomerDropOpen(false); }}
                          className="text-[#6c757d] hover:text-[#212529] font-bold text-[14px] leading-none cursor-pointer"
                        >×</span>
                      )}
                      {/* Arrow: up when open, down when closed */}
                      {customerDropOpen
                        ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className="w-[10px] h-[10px]"><path fill="#888" d="M288.66 352H31.34c-17.818 0-26.741-21.543-14.142-34.142l128.66-128.662c7.81-7.81 20.474-7.81 28.284 0l128.66 128.662c12.6 12.599 3.676 34.142-14.142 34.142z"/></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className="w-[10px] h-[10px]"><path fill="#888" d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"/></svg>
                      }
                    </div>
                  </div>
                  {/* Dropdown panel */}
                  {customerDropOpen && (
                    <div className="absolute top-[100%] left-0 w-full bg-white border border-[#ccc] z-[999] mt-[1px]" style={{ boxShadow: '0 4px 5px rgba(0,0,0,.15)' }}>
                      <div className="p-[4px]">
                        <input
                          autoFocus
                          type="text"
                          className="w-full border border-[#aaa] outline-none rounded-[3px] p-[4px] h-[30px]"
                          style={{ fontSize: '14.4px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                          value={customerSearchQuery}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomerSearchQuery(val);
                            setCustomerFocusedIndex(-1);
                            if (val.length >= 1) searchCustomers(val);
                            else setPatientNameOptions([]);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') { e.preventDefault(); setCustomerFocusedIndex(p => Math.min(p + 1, patientNameOptions.length - 1)); }
                            else if (e.key === 'ArrowUp') { e.preventDefault(); setCustomerFocusedIndex(p => Math.max(p - 1, 0)); }
                            else if (e.key === 'Enter') {
                              e.preventDefault();
                              const idx = customerFocusedIndex >= 0 ? customerFocusedIndex : 0;
                              if (patientNameOptions[idx]) {
                                const opt = patientNameOptions[idx];
                                setPatientName(opt.customer_name);
                                setPatientNameDisplay(opt.invoice_no ? `${opt.customer_name} - Bill No: ${opt.invoice_no}` : opt.customer_name);
                                setCustomerSearchQuery('');
                                setPatientNameOptions([]);
                                setCustomerFocusedIndex(-1);
                                setCustomerDropOpen(false);
                              }
                            } else if (e.key === 'Escape') { setCustomerDropOpen(false); }
                          }}
                          placeholder="Type to search..."
                        />
                      </div>
                      {customerSearchQuery.length >= 1 && patientNameOptions.length === 0 && (
                        <div className="px-[8px] py-[4px] text-[#212529]" style={{ fontSize: '14.4px' }}>No results found</div>
                      )}
                      {patientNameOptions.length > 0 && (
                        <div className="max-h-[200px] overflow-y-auto">
                          {patientNameOptions.map((opt, idx) => (
                            <div
                              key={idx}
                              className={`px-[8px] py-[6px] cursor-pointer ${idx === customerFocusedIndex ? 'bg-[#007bff] text-white' : 'text-[#212529] hover:bg-[#007bff] hover:text-white'}`}
                              style={{ fontSize: '14.4px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                              onMouseEnter={() => setCustomerFocusedIndex(idx)}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setPatientName(opt.customer_name);
                                setPatientNameDisplay(opt.invoice_no ? `${opt.customer_name} - Bill No: ${opt.invoice_no}` : opt.customer_name);
                                setCustomerSearchQuery('');
                                setPatientNameOptions([]);
                                setCustomerFocusedIndex(-1);
                                setCustomerDropOpen(false);
                              }}
                            >
                              {opt.invoice_no ? `${opt.customer_name} - Bill No: ${opt.invoice_no}` : opt.customer_name}
                            </div>
                          ))}
                        </div>
                      )}
                      {customerSearchQuery.length === 0 && (
                        <div className="px-[8px] py-[4px] text-[#6c757d]" style={{ fontSize: '13px' }}>Please enter 1 or more characters</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-[15px]">
              <div className="flex gap-[5px]">
                <ApplyFilterButton onClick={handleApplyFilter} />
                <ResetButton onClick={handleReset} />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-[3px] bg-white">
          {/* Exact Replica Top Controls */}
          <div className="flex justify-between items-center p-[14.4px]">
            
            <div className="flex items-center">
              {/* Pagination Left */}
              <div className="flex items-center ml-[10px]">
                <button 
                  onClick={() => setPage(0)}
                  disabled={page === 0}
                  className="bg-[#9FA5AA] text-white rounded-l-[3px] border border-[#8a9198] cursor-pointer flex items-center justify-center relative z-10 disabled:cursor-default"
                  style={{ padding: '3.6px 7.2px', width: '28.59px', height: '27.7px' }}
                >
                  <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 16" className="h-[12px] w-auto" fill="currentColor">
                    <polygon points="18,0 9,8 18,16" />
                    <polygon points="9,0 0,8 9,16" />
                  </svg>
                </button>
                <button 
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="bg-[#9FA5AA] text-white rounded-r-[3px] border border-[#8a9198] ml-[-1px] cursor-pointer flex items-center justify-center relative disabled:cursor-default"
                  style={{ padding: '3.6px 7.2px', width: '22.3px', height: '27.7px' }}
                >
                  <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 16" className="h-[12px] w-auto" fill="currentColor">
                    <polygon points="10,0 0,8 10,16" />
                  </svg>
                </button>
              </div>

              {/* Text Info */}
              <span className="text-[#212529] font-bold mx-[10px] text-[12.96px] whitespace-nowrap" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                {totalElements === 0 ? '0 to 0 of 0 (0)' : `${page * size + 1} to ${Math.min((page + 1) * size, totalElements)} of ${totalElements} (${Math.ceil(totalElements / size)})`}
              </span>

              {/* Pagination Right */}
              <div className="flex items-center">
                <button 
                  onClick={() => setPage(p => Math.min(Math.ceil(totalElements / size) - 1, p + 1))}
                  disabled={page >= Math.ceil(totalElements / size) - 1 || totalElements === 0}
                  className="bg-[#9FA5AA] text-white rounded-l-[3px] border border-[#8a9198] cursor-pointer flex items-center justify-center relative z-10 disabled:cursor-default"
                  style={{ padding: '3.6px 7.2px', width: '22.3px', height: '27.7px' }}
                >
                  <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 16" className="h-[12px] w-auto" fill="currentColor">
                    <polygon points="0,0 10,8 0,16" />
                  </svg>
                </button>
                <button 
                  onClick={() => setPage(Math.max(0, Math.ceil(totalElements / size) - 1))}
                  disabled={page >= Math.ceil(totalElements / size) - 1 || totalElements === 0}
                  className="bg-[#9FA5AA] text-white rounded-r-[3px] border border-[#8a9198] ml-[-1px] cursor-pointer flex items-center justify-center relative disabled:cursor-default"
                  style={{ padding: '3.6px 7.2px', width: '28.59px', height: '27.7px' }}
                >
                  <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 16" className="h-[12px] w-auto" fill="currentColor">
                    <polygon points="0,0 9,8 0,16" />
                    <polygon points="9,0 18,8 9,16" />
                  </svg>
                </button>
              </div>

              {/* Size Select */}
              <select 
                value={size}
                onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
                style={{
                  marginLeft: '8px',
                  padding: '5.4px 25.2px 5.4px 10.8px',
                  color: '#495057',
                  fontSize: '14.4px',
                  background: `#fff url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5' viewBox='0 0 4 5'%3e%3cpath fill='%23343a40' d='M2 0L0 2h4zm0 5L0 3h4z'/%3e%3c/svg%3e") no-repeat right .75rem center/8px 10px`,
                  border: '1px solid #ced4da',
                  borderRadius: '3px',
                  appearance: 'none',
                  width: '61.6px',
                  height: '34.4px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={1000000}>All</option>
              </select>

              {/* Page Select */}
              <select 
                value={page + 1}
                onChange={(e) => setPage(Number(e.target.value) - 1)}
                style={{
                  margin: '0px 0px 0px 8px',
                  padding: '5.4px 21.6px',
                  color: '#495057',
                  fontSize: '14.4px',
                  background: `#fff url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='4' height='5' viewBox='0 0 4 5'%3e%3cpath fill='%23343a40' d='M2 0L0 2h4zm0 5L0 3h4z'/%3e%3c/svg%3e") no-repeat right .75rem center/8px 10px`,
                  border: '1px solid #ced4da',
                  borderRadius: '3px',
                  appearance: 'none',
                  width: '52.8px',
                  height: '34.4px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {Array.from({ length: Math.max(1, Math.ceil(totalElements / size)) }, (_, i) => (
                  <option key={i} value={i + 1}>{i + 1}</option>
                ))}
              </select>

            </div>

            {/* Right Export Buttons */}
            <div className="flex gap-[4px] ml-auto">
              <button onClick={handleExportCSV} className="bg-[#17a2b8] text-white text-[12.6px] px-[10px] py-[6px] rounded-[3px] hover:bg-[#138496] transition-colors border-none">TO CSV</button>
              <button onClick={handleExportPDF} className="bg-[#dc3545] text-white text-[12.6px] px-[10px] py-[6px] rounded-[3px] hover:bg-[#c82333] transition-colors border-none">TO PDF</button>
              <button onClick={() => setShowMailModal(true)} className="bg-[#28a745] text-white text-[12.6px] px-[10px] py-[6px] rounded-[3px] hover:bg-[#218838] transition-colors border-none">MAIL</button>
              <button onClick={handleExportExcel} className="bg-[#ffc107] text-[#212529] text-[12.6px] px-[10px] py-[6px] rounded-[3px] hover:bg-[#e0a800] transition-colors border-none">TO EXCEL</button>
            </div>

          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-[3px] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ border: '1px solid #dee2e6' }}>
              <thead>
                <tr>
                  {[
                    { label: 'S.No', align: 'text-center', width: '60.33px' }, 
                    { label: 'Date', align: 'text-center', width: '66.01px' }, 
                    { label: 'Bill\nNo', align: 'text-center', width: '60.38px' }, 
                    { label: 'Customer\nName', align: 'text-center', width: '117.11px' }, 
                    { label: 'Taxable Amount\n(INR)', align: 'text-center', width: '118.09px' }, 
                    { label: 'Bill Amount\n(INR)', align: 'text-center', width: '105.84px' }, 
                    { label: 'Amount Received\n(INR)', align: 'text-center', width: '127.01px' }, 
                    { label: 'Discount\n(INR)', align: 'text-center', width: '101.84px' }, 
                    { label: 'Return Amount\n(INR)', align: 'text-center', width: '115.59px' }, 
                    { label: 'Refund Amount\n(INR)', align: 'text-center', width: '116.88px' }, 
                    { label: 'Balance Amount\n(INR)', align: 'text-center', width: '119.59px' }, 
                    { label: 'Status', align: 'text-center', width: '77.95px' }
                  ].map((col, idx) => {
                    return (
                      <th key={idx} className={col.align} style={{ 
                        padding: '4px', 
                        backgroundColor: '#EEEEEE', 
                        border: '1px solid #dee2e6',
                        height: '57.2px',
                        verticalAlign: 'bottom',
                        position: 'relative',
                        width: col.width || 'auto',
                        minWidth: col.width || 'auto'
                      }}>
                        <div style={{
                          width: '100%',
                          padding: '4px 18px 4px 4px',
                          boxSizing: 'border-box',
                          textAlign: col.align === 'text-right' ? 'right' : col.align === 'text-center' ? 'center' : 'left'
                        }}>
                          <span style={{ 
                            color: '#212529', 
                            fontFamily: 'Arial, sans-serif', 
                            fontSize: '12.96px', 
                            lineHeight: '1.5',
                            fontWeight: 'bold',
                            whiteSpace: 'pre-line'
                          }}>
                            {col.label}
                          </span>
                        </div>
                        <img 
                          src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 512' width='12' height='16'%3E%3Cpath fill='%23212529' d='M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41zm255-105L177 64c-9.4-9.4-24.6-9.4-33.9 0L24 183c-15.1 15.1-4.4 41 17 41h238c21.4 0 32.1-25.9 17-41z'/%3E%3C/svg%3E" 
                          style={{ position: 'absolute', right: '10.8px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '16px', cursor: 'pointer' }} 
                          alt="sort" 
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody style={{ 
                fontSize: '12.96px', 
                color: '#212529', 
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((row, idx) => {
                      const pName = row.customer_name || '';
                      const bAmount = parseFloat(row.bill_amount || 0);
                      const adv = parseFloat(row.advance || 0) - parseFloat(row.changeamt || 0);
                      const bal = parseFloat(row.balance || 0);
                      return (
                        <tr 
                          key={idx} 
                          className={`transition-colors duration-150 ${activeRow === idx ? 'bg-[#007bff]' : 'hover:bg-[#007bff]'}`}
                          onMouseEnter={() => setActiveRow(idx)}
                          onMouseLeave={() => setActiveRow(-1)}
                        >
                          <td className="border border-[#dee2e6] text-left" style={{ padding: '10.8px' }}>{page * size + idx + 1}</td>
                          <td className="border border-[#dee2e6] text-left" style={{ padding: '10.8px' }}>{formatDateTime(row.bill_date)}</td>
                          <td className="border border-[#dee2e6] text-center" style={{ padding: '10.8px' }}>{row.invoice_no || row.bill_id || ''}</td>
                          <td className="border border-[#dee2e6] text-left" style={{ padding: '10.8px' }}>{pName}</td>
                          <td className="border border-[#dee2e6] text-right" style={{ padding: '10.8px' }}>{parseFloat(row.subtotal || 0).toFixed(2)}</td>
                          <td className="border border-[#dee2e6] text-right" style={{ padding: '10.8px' }}>{bAmount.toFixed(2)}</td>
                          <td className="border border-[#dee2e6] text-right" style={{ padding: '10.8px' }}>{adv.toFixed(2)}</td>
                          <td className="border border-[#dee2e6] text-right" style={{ padding: '10.8px' }}>{parseFloat(row.total_discount || 0).toFixed(2)}</td>
                          <td className="border border-[#dee2e6] text-center" style={{ padding: '10.8px' }}>{row.return_item_amount || '0'}</td>
                          <td className="border border-[#dee2e6] text-center" style={{ padding: '10.8px' }}>{row.return_value ? parseFloat(row.return_value).toFixed(2) : '0.00'}</td>
                          <td className="border border-[#dee2e6] text-right" style={{ padding: '10.8px' }}>{bal.toFixed(2)}</td>
                          <td className="border border-[#dee2e6] text-center" style={{ padding: '10.8px' }}>{row.status || ''}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="12" className="border border-[#dee2e6] p-[16px] text-center text-[#212529] text-[12.96px]">
                        No Records Found.
                      </td>
                    </tr>
                  )}
                </tbody>
                {data.length > 0 && (
                  <tfoot className="bg-[#f1f2f3] text-[#212529] font-bold text-[12.96px] border-t-2 border-[#dee2e6]">
                    <tr>
                      <td className="border border-[#dee2e6] p-[6px] text-right" colSpan="4">Grand total</td>
                      <td className="border border-[#dee2e6] p-[6px] text-right">{parseFloat(totals.sum_subtotal || 0).toFixed(2)}</td>
                      <td className="border border-[#dee2e6] p-[6px] text-right">{parseFloat(totals.total_bill_amount || totals.sum_grand_total || 0).toFixed(2)}</td>
                      <td className="border border-[#dee2e6] p-[6px] text-right">{parseFloat(totals.sum_received || 0).toFixed(2)}</td>
                      <td className="border border-[#dee2e6] p-[6px]"></td>
                      <td className="border border-[#dee2e6] p-[6px]"></td>
                      <td className="border border-[#dee2e6] p-[6px]"></td>
                      <td className="border border-[#dee2e6] p-[6px] text-right">{parseFloat(totals.sum_balance || 0).toFixed(2)}</td>
                      <td className="border border-[#dee2e6] p-[6px]"></td>
                    </tr>
                    <tr>
                      <td className="border border-[#dee2e6] p-[6px]" colSpan="4"></td>
                      <td className="border border-[#dee2e6] p-[6px] text-center">Credit</td>
                      <td className="border border-[#dee2e6] p-[6px]"></td>
                      <td className="border border-[#dee2e6] p-[6px] text-center">Debit</td>
                      <td className="border border-[#dee2e6] p-[6px]" colSpan="5"></td>
                    </tr>
                    {[
                      { name: 'Cash', label: 'Cash Payments' },
                      { name: 'Card', label: 'Card Payments' },
                      { name: 'Google Pay', label: 'Google Pay Payments' },
                      { name: 'Credit', label: 'Credit Payments' },
                      { name: 'PhonePe', label: 'PhonePe Payments' },
                      { name: 'Cheque', label: 'Cheque Payments' },
                      { name: 'Amazon Pay', label: 'Amazon Pay Payments' },
                      { name: 'Paytm', label: 'Paytm Payments' },
                      { name: 'Insurance', label: 'Insurance Payments' },
                      { name: 'Net Banking', label: 'Net Banking' }
                    ].map((mode, idx) => {
                      const pm = modePayments.find(m => m.payment_mode === mode.name);
                      return (
                        <tr key={idx}>
                          <td className="border border-[#dee2e6] p-[6px] text-right" colSpan="4">{mode.label}</td>
                          <td className="border border-[#dee2e6] p-[6px] text-right">{pm && pm.credit ? parseFloat(pm.credit).toFixed(2) : '0.00'}</td>
                          <td className="border border-[#dee2e6] p-[6px]"></td>
                          <td className="border border-[#dee2e6] p-[6px] text-right">{pm && pm.debit ? parseFloat(pm.debit).toFixed(2) : '0.00'}</td>
                          <td className="border border-[#dee2e6] p-[6px]" colSpan="5"></td>
                        </tr>
                      );
                    })}
                  </tfoot>
                )}
              </table>
          </div>

                  {/* Old PaginationControls removed */}
        </div>

        {/* Exact Replica Summary Section */}
        <div className="col-lg-6 col-sm-6 col-md-6 mt-1" style={{ margin: '15px 0px 0px', color: '#212529' }}>
          <style>
            {`
              .summary-rows-container {
                padding-left: 50px;
                margin-top: 5px;
              }
              .summary-row {
                display: flex;
                align-items: center;
                margin-bottom: 2px;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              }
              .summary-row b {
                display: inline-block;
                width: 290px;
                font-size: 12.96px;
                font-weight: bold;
                color: #212529;
              }
              .summary-row b::after {
                content: ":";
                float: right;
              }
              .summary-row span.text-right {
                font-size: 12.96px;
                color: #212529;
                padding-left: 20px;
              }
            `}
          </style>
          
          <div style={{ margin: '3.6px 0px 0px', padding: '0px 15px' }}>
            <h4 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px 0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
              Summary : (only completed Bills)
            </h4>
            
            <div className="summary-rows-container">
              {[
                { label: 'Total Taxable Amount (INR)', id: 'tot_tax_amt', value: totals.sum_subtotal ? parseFloat(totals.sum_subtotal).toFixed(2) : '0' },
                { label: 'Total Bill Amount', id: 'tot_bill_amt', value: (totals.total_bill_amount || totals.sum_grand_total) ? parseFloat(totals.total_bill_amount || totals.sum_grand_total).toFixed(2) : '0' },
                { label: 'Total Amount Received', id: 'tot_amt_recv', value: totals.sum_received !== undefined ? parseFloat(totals.sum_received).toFixed(2) : '0' },
                { label: 'Total Discount', value: totals.total_discount ? parseFloat(totals.total_discount).toFixed(2) : '0' },
                { label: 'Total Balance', value: totals.sum_balance !== undefined ? parseFloat(totals.sum_balance).toFixed(2) : '0' },
                { label: 'Total Refund Amount', value: totals.total_refund ? parseFloat(totals.total_refund).toFixed(2) : '0' },
                { label: 'Cash', value: modePayments.find(m => m.payment_mode === 'Cash')?.credit ? parseFloat(modePayments.find(m => m.payment_mode === 'Cash').credit).toFixed(2) : '0' },
                { label: 'Card', value: modePayments.find(m => m.payment_mode === 'Card')?.credit ? parseFloat(modePayments.find(m => m.payment_mode === 'Card').credit).toFixed(2) : '0' },
                { label: 'Google Pay', value: modePayments.find(m => m.payment_mode === 'Google Pay')?.credit ? parseFloat(modePayments.find(m => m.payment_mode === 'Google Pay').credit).toFixed(2) : '0' },
                { label: 'Credit', value: modePayments.find(m => m.payment_mode === 'Credit')?.credit ? parseFloat(modePayments.find(m => m.payment_mode === 'Credit').credit).toFixed(2) : '0' },
                { label: 'PhonePe', value: modePayments.find(m => m.payment_mode === 'PhonePe')?.credit ? parseFloat(modePayments.find(m => m.payment_mode === 'PhonePe').credit).toFixed(2) : '0' },
                { label: 'Cheque', value: modePayments.find(m => m.payment_mode === 'Cheque')?.credit ? parseFloat(modePayments.find(m => m.payment_mode === 'Cheque').credit).toFixed(2) : '0' },
                { label: 'Amazon Pay', value: modePayments.find(m => m.payment_mode === 'Amazon Pay')?.credit ? parseFloat(modePayments.find(m => m.payment_mode === 'Amazon Pay').credit).toFixed(2) : '0' },
                { label: 'Paytm', value: modePayments.find(m => m.payment_mode === 'Paytm')?.credit ? parseFloat(modePayments.find(m => m.payment_mode === 'Paytm').credit).toFixed(2) : '0' },
                { label: 'Net Banking', value: modePayments.find(m => m.payment_mode === 'Net Banking')?.credit ? parseFloat(modePayments.find(m => m.payment_mode === 'Net Banking').credit).toFixed(2) : '0' },
                { label: 'Insurance', value: modePayments.find(m => m.payment_mode === 'Insurance')?.credit ? parseFloat(modePayments.find(m => m.payment_mode === 'Insurance').credit).toFixed(2) : '0' }
              ].map((item, idx) => (
                <div key={idx} className="summary-row">
                  <b>{item.label}</b>
                  <span id={item.id} className="text-right">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-[#999999] py-4 mt-8">
          Copyright &copy; NIGSOFT Private Ltd
        </div>

      </div>

      {/* Mail Modal */}
      {showMailModal && (
        <div 
          className="fixed inset-0 z-[1050] overflow-x-hidden overflow-y-auto bg-[rgba(0,0,0,0.5)] flex justify-center items-start pt-[75px]"
          onClick={() => { setShowMailModal(false); setMailEmail(''); }}
        >
          <div 
            className="bg-white rounded-[4px] shadow-lg w-[500px] max-w-[90%] overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-[16px] py-[12px] border-b border-[#dee2e6]">
              <h5 className="font-bold text-[16px] text-[#212529] m-0 tracking-wide uppercase">
                SHARE VIA EMAIL
              </h5>
              <button
                type="button"
                onClick={() => { setShowMailModal(false); setMailEmail(''); }}
                className="text-[#000] opacity-50 hover:opacity-75 text-[22px] font-bold leading-none cursor-pointer border-none bg-transparent p-0"
                style={{ outline: 'none' }}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="p-[16px]">
              <label className="block text-[14px] text-[#212529] mb-[6px]">Email ID:</label>
              <input
                type="email"
                value={mailEmail}
                onChange={(e) => setMailEmail(e.target.value)}
                placeholder="Enter Valid Mail ID"
                className="w-full border border-[#ced4da] rounded-[4px] outline-none focus:border-[#80bdff] focus:ring-1 focus:ring-[#80bdff] text-[14px] text-[#495057]"
                style={{ padding: '6px 12px', height: '38px', marginBottom: '20px' }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMail();
                  if (e.key === 'Escape') { setShowMailModal(false); setMailEmail(''); }
                }}
              />
              <div className="flex justify-end items-center gap-[6px]">
                <button
                  type="button"
                  onClick={() => { setShowMailModal(false); setMailEmail(''); }}
                  className="px-[14px] py-[7px] rounded-[4px] text-[14px] text-white border-none cursor-pointer font-normal hover:bg-[#5a6268] transition-colors"
                  style={{ backgroundColor: '#6c757d' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendMail}
                  disabled={mailSending}
                  className="px-[14px] py-[7px] rounded-[4px] text-[14px] text-white border-none cursor-pointer font-normal hover:bg-[#0069d9] transition-colors"
                  style={{ backgroundColor: '#007bff', opacity: mailSending ? 0.7 : 1 }}
                >
                  {mailSending ? 'Sending...' : 'Share'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

