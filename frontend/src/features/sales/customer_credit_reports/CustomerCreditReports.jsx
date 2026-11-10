import React, { useState, useEffect, useCallback } from 'react';
import PaginationControls from '../../../components/PaginationControls';
import { ApplyFilterButton, ResetButton } from '../../../components/FilterButtons';
import SearchableSelect from '../../../components/SearchableSelect';
import ToCsvButton from '../../../components/ToCsvButton';
import ToExcelButton from '../../../components/ToExcelButton';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../AuthContext';
import { apiConfig } from '../../../config';

// Helper to format date as YYYY-MM-DD for HTML5 date inputs
const formatDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getDateRangeForFilter = (filter) => {
  const today = new Date();
  switch (filter) {
    case 'Today':
      return { from: formatDate(today), to: formatDate(today) };
    case 'Yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: formatDate(yesterday), to: formatDate(yesterday) };
    }
    case 'Last 7 Days': {
      const past7 = new Date(today);
      past7.setDate(past7.getDate() - 6);
      return { from: formatDate(past7), to: formatDate(today) };
    }
    case 'Next 7 Days': {
      const next7 = new Date(today);
      next7.setDate(next7.getDate() + 6);
      return { from: formatDate(today), to: formatDate(next7) };
    }
    case 'Current Month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: formatDate(firstDay), to: formatDate(today) };
    }
    case 'Last Month': {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: formatDate(firstDayLastMonth), to: formatDate(lastDayLastMonth) };
    }
    case 'Custom Date':
    default:
      return null;
  }
};

export default function CustomerCreditReports() {
  const { token } = useAuth();

  // Filter States
  const todayStr = formatDate(new Date());
  const [patientName, setPatientName] = useState(null);
  const [dateFilter, setDateFilter] = useState('Today');
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);

  // Pagination & Table States
  const [recordsPerPage, setRecordsPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('bill_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Data rows & Summaries
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalBillAmount, setTotalBillAmount] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Search API for patient name autocompletion
  const searchPatients = async (term) => {
    if (!token) return [];
    try {
      const res = await fetch(`${apiConfig.base_url}/sales/customer-credit-reports/search-patients?term=${encodeURIComponent(term)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
    return [];
  };

  const fetchReportData = useCallback(async (
    page = currentPage,
    size = recordsPerPage,
    sort = sortField,
    order = sortOrder,
    fromD = fromDate,
    toD = toDate,
    cust = patientName
  ) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const customerId = typeof cust === 'object' ? cust?.id : null;
      const customerSearch = typeof cust === 'object' ? cust?.name : cust;
      const querySize = String(size).toLowerCase() === 'all' ? '10000' : String(size);
      const params = new URLSearchParams({
        page: String(Math.max(0, page - 1)),
        size: querySize,
        sort_field: sort || 'bill_date',
        sort_order: order || 'desc'
      });
      if (customerId) params.append('customer_id', String(customerId));
      if (customerSearch) params.append('customer_name', customerSearch);
      if (fromD) params.append('fdate', fromD);
      if (toD) params.append('tdate', toD);

      const res = await fetch(`${apiConfig.base_url}/sales/customer-credit-reports/?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.result || []);
        setTotalCount(json.count || 0);
        setTotalBillAmount(json.total_bill_amount || json.total_amount || 0);
        setTotalBalance(json.total_balance || 0);
      }
    } catch (err) {
      console.error('Error fetching customer credit report data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, currentPage, recordsPerPage, sortField, sortOrder, fromDate, toDate, patientName]);

  const handleDateFilterChange = (newFilter) => {
    setDateFilter(newFilter);
    const range = getDateRangeForFilter(newFilter);
    if (range) {
      setFromDate(range.from);
      setToDate(range.to);
    }
  };

  // Load initial customer credit data dynamically on mount with Today's date
  useEffect(() => {
    if (!token) return;
    const today = formatDate(new Date());
    setDateFilter('Today');
    setFromDate(today);
    setToDate(today);
    fetchReportData(1, 10, 'bill_date', 'desc', today, today, null);
  }, [token]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchReportData(1, recordsPerPage, sortField, sortOrder, fromDate, toDate, patientName);
  };

  const handleReset = () => {
    const today = formatDate(new Date());
    setPatientName(null);
    setDateFilter('Today');
    setFromDate(today);
    setToDate(today);
    setCurrentPage(1);
    fetchReportData(1, recordsPerPage, 'bill_date', 'desc', today, today, null);
  };

  const handleSort = (field) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
    fetchReportData(currentPage, recordsPerPage, field, newOrder);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchReportData(newPage, recordsPerPage, sortField, sortOrder);
  };

  const handleRecordsPerPageChange = (newSize) => {
    setRecordsPerPage(newSize);
    setCurrentPage(1);
    fetchReportData(1, newSize, sortField, sortOrder);
  };

  const renderSortIcon = (field) => {
    return (
      <span className="inline-flex items-center shrink-0">
        <svg width="9" height="12" viewBox="0 0 10 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.5 4.5L5 1L8.5 4.5" stroke="#000000" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter" />
          <path d="M1.5 8.5L5 12L8.5 8.5" stroke="#000000" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter" />
        </svg>
      </span>
    );
  };

  const exportToCSV = () => {
    if (data.length === 0) {
      alert('No data available to export');
      return;
    }
    const headers = ['S.No', 'Patient Name', 'Bill No', 'Bill Date', 'Bill Amount', 'Balance', 'Due Date', 'Count'];
    const rows = data.map((item, index) => [
      (currentPage - 1) * Number(recordsPerPage === 'All' ? 0 : recordsPerPage) + index + 1,
      `"${item.patientName || item.customerName || ''}"`,
      item.billNo || '',
      item.billDate || '',
      parseFloat(item.billAmount || 0).toFixed(2),
      parseFloat(item.balance || 0).toFixed(2),
      item.dueDate || '',
      item.count ?? ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Customer_Credit_Reports.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      alert('No data available to export');
      return;
    }
    const exportData = data.map((item, index) => ({
      'S.No': (currentPage - 1) * Number(recordsPerPage === 'All' ? 0 : recordsPerPage) + index + 1,
      'Patient Name': item.patientName || item.customerName || '',
      'Bill No': item.billNo || '',
      'Bill Date': item.billDate || '',
      'Bill Amount': parseFloat(item.billAmount || 0).toFixed(2),
      'Balance': parseFloat(item.balance || 0).toFixed(2),
      'Due Date': item.dueDate || '',
      'Count': item.count ?? ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Credit Reports");
    XLSX.writeFile(workbook, "Customer_Credit_Reports.xlsx");
  };

  return (
    <div className="px-[15px] pt-[15px] pb-0 bg-white min-h-screen flex flex-col font-sans text-gray-800 antialiased">

      {/* Page Title */}
      <h3
        style={{
          color: '#323F52',
          fontSize: '25.2px',
          lineHeight: '30.24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          margin: '18px 0px 28px 0px',
          fontWeight: '500',
          textTransform: 'uppercase',
        }}
      >
        CUSTOMER CREDIT REPORTS
      </h3>

      {/* Filters Card Container */}
      <div
        className="patients-filter-panel"
        style={{
          color: '#212529',
          fontSize: '12.96px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          margin: '0px 0px 18px 0px',
          padding: '12px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
        }}
      >
        {/* Filters Header */}
        <div
          className="patients-filter-title"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#212529',
            fontSize: '14px',
            lineHeight: '19.44px',
            fontFamily: 'Arial, sans-serif',
            margin: '0px 0px 8px 0px',
            fontWeight: '600',
          }}
        >
          <svg className="w-3.5 h-3.5 fill-[#212529]" viewBox="0 0 24 24">
            <path d="M2.5 4C2.5 3.44772 2.94772 3 3.5 3H20.5C21.0523 3 21.5 3.44772 21.5 4C21.5 4.30472 21.3638 4.5936 21.1287 4.7876L14.5 10.25V18.25C14.5 18.5724 14.3444 18.8724 14.0799 19.0601L10.5799 21.5601C10.0984 21.904 9.5 21.5594 9.5 20.9702V10.25L2.87132 4.7876C2.63616 4.5936 2.5 4.30472 2.5 4Z" />
          </svg>
          <span>Filters</span>
        </div>

        {/* Filters Form Row */}
        <div
          className="form-row mt-2 flex flex-nowrap items-end gap-2.5 w-full"
          style={{
            color: '#212529',
            fontSize: '12.96px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {/* Patient Name */}
          <div style={{ flex: '1.2 1 0%', minWidth: '160px' }}>
            <SearchableSelect
              id="select2-search_customer_name-container"
              label="Patient Name"
              value={patientName}
              onChange={(val) => setPatientName(val)}
              placeholder="Type at least 3 letters..."
              minChars={3}
              minCharsMessage="Please enter 3 or more characters"
              onSearch={searchPatients}
            />
          </div>

          {/* Date Filter */}
          <div style={{ flex: '1.15 1 0%', minWidth: '140px' }}>
            <label
              htmlFor="selector"
              style={{
                color: '#212529',
                fontFamily: 'Arial, sans-serif',
                fontSize: '12.96px',
                margin: '0px 0px 4px 0px',
                display: 'block',
                fontWeight: '600',
              }}
            >
              Date Filter
            </label>
            <div className="relative w-full">
              <select
                id="selector"
                className="form-control w-full"
                value={dateFilter}
                autoComplete="off"
                onChange={(e) => handleDateFilterChange(e.target.value)}
                style={{
                  color: '#495057',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontSize: '14.4px',
                  backgroundColor: '#FFFFFF',
                  padding: '4px 24px 4px 8px',
                  height: '35px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  outline: 'none',
                  appearance: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Next 7 Days">Next 7 Days</option>
                <option value="Current Month">Current Month</option>
                <option value="Last Month">Last Month</option>
                <option value="Custom Date">Custom Date</option>
              </select>
              <div
                className="pointer-events-none"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <b
                  style={{
                    width: '0',
                    height: '0',
                    borderStyle: 'solid',
                    borderColor: '#888 transparent transparent transparent',
                    borderWidth: '5px 4px 0 4px',
                    display: 'inline-block',
                  }}
                />
              </div>
            </div>
          </div>

          {/* From Date */}
          <div style={{ flex: '0.9 1 0%', minWidth: '120px' }}>
            <label
              htmlFor="fdate"
              style={{
                color: '#212529',
                fontFamily: 'Arial, sans-serif',
                fontSize: '12.96px',
                margin: '0px 0px 4px 0px',
                display: 'block',
                fontWeight: '600',
              }}
            >
              From Date
            </label>
            <input
              id="fdate"
              className="form-control w-full"
              type="date"
              value={fromDate}
              autoComplete="off"
              onChange={(e) => setFromDate(e.target.value)}
              disabled={dateFilter !== 'Custom Date'}
              style={{
                color: '#495057',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '14.4px',
                backgroundColor: dateFilter === 'Custom Date' ? '#FFFFFF' : '#e9ecef',
                padding: '4px 10px',
                height: '35px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>

          {/* To Date */}
          <div style={{ flex: '0.9 1 0%', minWidth: '120px' }}>
            <label
              htmlFor="tdate"
              style={{
                color: '#212529',
                fontFamily: 'Arial, sans-serif',
                fontSize: '12.96px',
                margin: '0px 0px 4px 0px',
                display: 'block',
                fontWeight: '600',
              }}
            >
              To Date
            </label>
            <input
              id="tdate"
              className="form-control w-full"
              type="date"
              value={toDate}
              autoComplete="off"
              onChange={(e) => setToDate(e.target.value)}
              disabled={dateFilter !== 'Custom Date'}
              style={{
                color: '#495057',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '14.4px',
                backgroundColor: dateFilter === 'Custom Date' ? '#FFFFFF' : '#e9ecef',
                padding: '4px 10px',
                height: '35px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>

          {/* Apply Filters Button */}
          <div className="shrink-0">
            <ApplyFilterButton onClick={handleApplyFilters} />
          </div>

          {/* Reset Button */}
          <div className="shrink-0">
            <ResetButton onClick={handleReset} />
          </div>
        </div>
      </div>

      {/* Table & Toolbar Wrapper */}
      <div
        className="col-lg-12 col-md-12 col-sm-12 mt-3"
        style={{
          color: '#212529',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: '12.96px',
          margin: '14.4px 0px 0px',
          padding: '0px 15px',
        }}
      >
        {/* Control Toolbar Row */}
        <div
          className="row flex flex-nowrap items-center w-full"
          style={{
            margin: '0px -15px 12px -15px',
            padding: '0px 15px',
            color: '#212529',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: '12.96px',
            minHeight: '36.4px',
          }}
        >
          {/* Total Count */}
          <div
            className="flex items-center shrink-0"
            style={{
              color: '#323F52',
              fontSize: '15.84px',
              fontWeight: '600',
              gap: '4px',
              margin: 0,
              padding: 0,
            }}
          >
            <span>Total Count :</span>
            <span style={{ color: '#0052cc' }}>{totalCount}</span>
          </div>

          {/* Records Per Page */}
          <div className="flex items-center shrink-0" style={{ marginLeft: '30px' }}>
            <span
              style={{
                color: '#323F52',
                fontSize: '15.84px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                marginRight: '10px',
              }}
            >
              Records Per Page
            </span>
            <div className="relative flex items-center">
              <select
                id="pagesize"
                className="form-control-sm custom-select pagesize"
                value={recordsPerPage}
                onChange={(e) => handleRecordsPerPageChange(e.target.value)}
                style={{
                  width: '61.6px',
                  height: '34.4px',
                  color: '#495057',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontSize: '14.4px',
                  backgroundColor: '#FFFFFF',
                  padding: '5.4px 25.2px 5.4px 10.8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  appearance: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  margin: 0,
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="All">All</option>
              </select>
              <div
                className="pointer-events-none flex items-center justify-center"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 1L0.8 4.8H7.2L4 1Z" fill="#343a40" />
                  <path d="M4 11L0.8 7.2H7.2L4 11Z" fill="#343a40" />
                </svg>
              </div>
            </div>
          </div>

          <PaginationControls 
            page={currentPage - 1} 
            setPage={(p) => handlePageChange(p + 1)} 
            size={recordsPerPage === 'All' ? 1000000 : Number(recordsPerPage)} 
            totalCount={totalCount} 
          />

          <div className="flex items-center shrink-0 ml-auto gap-2">
            {/* Export to CSV */}
            <ToCsvButton onClick={exportToCSV} />

            {/* Export to Excel */}
            <ToExcelButton onClick={exportToExcel} />
          </div>
        </div>

        {/* Main Data Table */}
        <div className="border border-[#dee2e6] rounded overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#EEEEEE] text-[#212529] font-bold border-b border-[#dee2e6]">
                {/* S.No */}
                <th className="border-r border-[#dee2e6] p-0 text-center font-bold" style={{ width: '5%', minWidth: '55px', height: '38px' }}>
                  <div
                    className="tablesorter-header-inner"
                    style={{
                      color: '#212529',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13.5px',
                      padding: '8px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                    }}
                  >
                    S.No
                  </div>
                </th>

                {/* Patient Name */}
                <th
                  className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                  onClick={() => handleSort('customer_name')}
                  style={{ width: '22%', minWidth: '180px', height: '38px' }}
                >
                  <div
                    className="tablesorter-header-inner"
                    style={{
                      color: '#212529',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13.5px',
                      padding: '8px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      position: 'relative',
                      textAlign: 'center',
                    }}
                  >
                    <span>Patient Name</span>
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                      {renderSortIcon('customer_name')}
                    </div>
                  </div>
                </th>

                {/* Bill No */}
                <th
                  className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                  onClick={() => handleSort('bill_no')}
                  style={{ width: '14%', minWidth: '110px', height: '38px' }}
                >
                  <div
                    className="tablesorter-header-inner"
                    style={{
                      color: '#212529',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13.5px',
                      padding: '8px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      position: 'relative',
                      textAlign: 'center',
                    }}
                  >
                    <span>Bill No</span>
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                      {renderSortIcon('bill_no')}
                    </div>
                  </div>
                </th>

                {/* Bill Date */}
                <th
                  className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                  onClick={() => handleSort('bill_date')}
                  style={{ width: '14%', minWidth: '110px', height: '38px' }}
                >
                  <div
                    className="tablesorter-header-inner"
                    style={{
                      color: '#212529',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13.5px',
                      padding: '8px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      position: 'relative',
                      textAlign: 'center',
                    }}
                  >
                    <span>Bill Date</span>
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                      {renderSortIcon('bill_date')}
                    </div>
                  </div>
                </th>

                {/* Bill Amount */}
                <th
                  className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                  onClick={() => handleSort('bill_amount')}
                  style={{ width: '15%', minWidth: '120px', height: '38px' }}
                >
                  <div
                    className="tablesorter-header-inner"
                    style={{
                      color: '#212529',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13.5px',
                      padding: '8px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      position: 'relative',
                      textAlign: 'center',
                    }}
                  >
                    <span>Bill Amount</span>
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                      {renderSortIcon('bill_amount')}
                    </div>
                  </div>
                </th>

                {/* Balance */}
                <th
                  className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                  onClick={() => handleSort('balance')}
                  style={{ width: '14%', minWidth: '110px', height: '38px' }}
                >
                  <div
                    className="tablesorter-header-inner"
                    style={{
                      color: '#212529',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13.5px',
                      padding: '8px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      position: 'relative',
                      textAlign: 'center',
                    }}
                  >
                    <span>Balance</span>
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                      {renderSortIcon('balance')}
                    </div>
                  </div>
                </th>

                {/* Due Date */}
                <th
                  className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                  onClick={() => handleSort('due_date')}
                  style={{ width: '10%', minWidth: '95px', height: '38px' }}
                >
                  <div
                    className="tablesorter-header-inner"
                    style={{
                      color: '#212529',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13.5px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      position: 'relative',
                      textAlign: 'center',
                    }}
                  >
                    <span>Due Date</span>
                    <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                      {renderSortIcon('due_date')}
                    </div>
                  </div>
                </th>

                {/* Count */}
                <th
                  className="p-0 cursor-pointer select-none font-bold"
                  onClick={() => handleSort('count')}
                  style={{ width: '6%', minWidth: '60px', height: '38px' }}
                >
                  <div
                    className="tablesorter-header-inner"
                    style={{
                      color: '#212529',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13.5px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      position: 'relative',
                      textAlign: 'center',
                    }}
                  >
                    <span>Count</span>
                    <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' }}>
                      {renderSortIcon('count')}
                    </div>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr className="bg-white">
                  <td colSpan={8} className="py-8 text-center text-[13.5px] text-[#0052cc] font-medium">
                    Loading data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr className="bg-white">
                  <td colSpan={8} className="py-6 text-center text-[13px] text-[#495057] font-normal">
                    No Data Found
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={index} className="border-b border-[#dee2e6] hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-center text-gray-600 border-r border-[#dee2e6]">
                      {recordsPerPage === 'All' ? index + 1 : (currentPage - 1) * Number(recordsPerPage) + index + 1}
                    </td>
                    <td className="py-2.5 px-4 text-gray-800 border-r border-[#dee2e6] font-medium">{row.patientName || row.customerName}</td>
                    <td className="py-2.5 px-3 text-center text-gray-700 font-medium border-r border-[#dee2e6]">{row.billNo}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600 border-r border-[#dee2e6]">{row.billDate}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700 border-r border-[#dee2e6]">{parseFloat(row.billAmount || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700 border-r border-[#dee2e6]">{parseFloat(row.balance || 0).toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600 border-r border-[#dee2e6]">{row.dueDate || '-'}</td>
                    <td className="py-2.5 px-3 text-center text-gray-600">{row.count ?? ''}</td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Table Footer: Total */}
            <tfoot>
              <tr className="bg-[#f8f9fa] text-[#212529] font-bold border-t border-[#dee2e6]">
                <td colSpan={4} className="py-2.5 px-4 text-center font-bold">
                  Total
                </td>
                <td className="py-2.5 px-3 text-center font-bold text-[#212529]">
                  {parseFloat(totalBillAmount || 0).toFixed(2)}
                </td>
                <td colSpan={3} className="py-2.5 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footer pinned to bottom */}
      <footer className="w-full text-center mt-auto pt-10 pb-4 text-[10.8px] text-[#6c757d] select-none font-sans">
        Copyright &copy; NIGSOFT Private Ltd
      </footer>
    </div>
  );
}
