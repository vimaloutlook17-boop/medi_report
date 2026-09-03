import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchableSelect from '../../../components/SearchableSelect';

// Sample product options for autocomplete
const SAMPLE_PRODUCTS = [
  'Paracetamol 500mg',
  'Amoxicillin 250mg',
  'Cetirizine 10mg',
  'Pantoprazole 40mg',
  'Azithromycin 500mg',
  'Metformin 500mg',
  'Atorvastatin 10mg',
  'Ibuprofen 400mg',
  'Omeprazole 20mg',
  'Dolo 650mg',
];

// Sample patient options for autocomplete
const SAMPLE_PATIENTS = [
  'John Doe (UHID: P1001)',
  'Jane Smith (UHID: P1002)',
  'Robert Johnson (UHID: P1003)',
  'Michael Brown (UHID: P1004)',
  'Emily Davis (UHID: P1005)',
  'David Wilson (UHID: P1006)',
  'Sarah Taylor (UHID: P1007)',
  'James Anderson (UHID: P1008)',
  'Patricia Thomas (UHID: P1009)',
  'Christopher Jackson (UHID: P1010)',
];

export default function CustomerWiseProductList() {
  const [selectedItem, setSelectedItem] = useState('');
  const [patientName, setPatientName] = useState('');
  const [dateFilter, setDateFilter] = useState('Today');
  const [fromDate, setFromDate] = useState('2026-09-01');
  const [toDate, setToDate] = useState('2026-09-01');

  // Filter application state
  const [appliedFilters, setAppliedFilters] = useState({
    item: '',
    patient: '',
    dateFilter: 'Today',
    from: '2026-09-01',
    to: '2026-09-01',
  });

  // Table state
  const [data, setData] = useState([]);
  const [recordsPerPage, setRecordsPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleApplyFilters = () => {
    setAppliedFilters({
      item: selectedItem,
      patient: patientName,
      dateFilter,
      from: fromDate,
      to: toDate,
    });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSelectedItem('');
    setPatientName('');
    setDateFilter('Today');
    setFromDate('2026-09-01');
    setToDate('2026-09-01');
    setAppliedFilters({
      item: '',
      patient: '',
      dateFilter: 'Today',
      from: '2026-09-01',
      to: '2026-09-01',
    });
    setCurrentPage(1);
  };

  const handleDateFilterChange = (val) => {
    setDateFilter(val);
    if (val === 'Today') {
      setFromDate('2026-09-01');
      setToDate('2026-09-01');
    } else if (val === 'Yesterday') {
      setFromDate('2026-08-31');
      setToDate('2026-08-31');
    } else if (val === 'Last 7 Days') {
      setFromDate('2026-08-25');
      setToDate('2026-09-01');
    } else if (val === 'Current Month') {
      setFromDate('2026-09-01');
      setToDate('2026-09-30');
    } else if (val === 'Last Month') {
      setFromDate('2026-08-01');
      setToDate('2026-08-31');
    } else if (val === 'Last 3 Months') {
      setFromDate('2026-06-01');
      setToDate('2026-09-01');
    }
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    let aVal = a[sortColumn];
    let bVal = b[sortColumn];

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalCount = sortedData.length;
  const totalQuantity = sortedData.reduce((acc, row) => acc + (Number(row.qty) || 0), 0);

  const exportToCSV = () => {
    if (data.length === 0) {
      alert('No data available to export');
      return;
    }
    const headers = ['S.No', 'Bill No', 'Date', 'Product Name', 'Qty', 'Batch', 'Exp Date'];
    const rows = data.map((item, index) => [
      index + 1,
      `"${item.billNo || ''}"`,
      `"${item.date || ''}"`,
      `"${item.productName || ''}"`,
      item.qty || 0,
      `"${item.batch || ''}"`,
      `"${item.expDate || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Customer_Wise_Product_List.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      alert('No data available to export');
      return;
    }
    exportToCSV();
  };

  const renderSortIcon = (column) => {
    return (
      <span className="inline-flex items-center shrink-0" style={{ marginLeft: '22px' }}>
        <svg width="9" height="12" viewBox="0 0 10 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1.5 4.5L5 1L8.5 4.5" stroke="#000000" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter" />
          <path d="M1.5 8.5L5 12L8.5 8.5" stroke="#000000" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter" />
        </svg>
      </span>
    );
  };

  const tabs = [
    { label: 'ProductWise Customer', path: '/sales/product-wise-customer' },
    { label: 'Product Wise Unique Customer', path: '/sales/product-wise-unique-customer' },
    { label: 'Customer Wise Product', path: '/sales/customer-wise-product', active: true },
  ];

  return (
    <div className="px-[15px] pt-[15px] pb-0 bg-white min-h-full font-sans text-gray-800 antialiased">
      {/* Tabs Row Container */}
      <div className="mb-[20px]">
        <ul className="flex flex-wrap m-0 p-0 list-none text-[12.96px] text-[#212529] font-sans border-b border-[#ddd]">
          {tabs.map((tab, i) => (
            <li key={i} className="mr-[2px] mb-[-1px]">
              {tab.active ? (
                <span className="inline-block px-[10px] py-[7.2px] text-[#555] bg-white border border-[#ddd] border-b-transparent rounded-t-[4px] cursor-default relative z-10">
                  {tab.label}
                </span>
              ) : (
                <Link 
                  to={tab.path} 
                  className="inline-block px-[10px] py-[7.2px] border border-transparent rounded-t-[4px] text-[#007BFF] hover:bg-transparent hover:text-[#212529] hover:border-[#ddd] relative hover:z-10 transition-colors"
                >
                  {tab.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Page Title */}
      <h3
        style={{
          color: '#323F52',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: '25.2px',
          fontWeight: '500',
          margin: '18px 0px 28px 0px',
        }}
      >
        CUSTOMER WISE PRODUCT LIST
      </h3>

      {/* Filters Form Container */}
      <div
        className="border border-[#e3e6ec] rounded-[4px] p-[15px] mb-[15px] bg-[#fbfbfb]"
        style={{
          boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Filter Header */}
        <div className="flex items-center gap-1.5 font-bold text-[#212529] text-[13px] border-b border-[#eee] pb-2">
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
          {/* Select Item */}
          <div className="flex-1 min-w-[180px]">
            <SearchableSelect
              id="select2-item_value-container"
              label="Select Item"
              value={selectedItem}
              onChange={(val) => setSelectedItem(val)}
              placeholder="Type to search product..."
              minChars={2}
              minCharsMessage="Please enter 2 or more characters"
              options={SAMPLE_PRODUCTS}
            />
          </div>

          {/* Patient Name */}
          <div className="flex-1 min-w-[180px]">
            <SearchableSelect
              id="select2-search_customer_name-container"
              label="Patient Name"
              value={patientName}
              onChange={(val) => setPatientName(val)}
              placeholder="Type to search patient..."
              minChars={3}
              minCharsMessage="Please enter 3 or more characters"
              options={SAMPLE_PATIENTS}
            />
          </div>

          {/* Date Filter */}
          <div className="w-[140px] shrink-0">
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
            <div className="relative">
              <select
                id="selector"
                className="form-control"
                value={dateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                style={{
                  color: '#495057',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  fontSize: '14.4px',
                  backgroundColor: '#FFFFFF',
                  padding: '4px 24px 4px 10.8px',
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
                <option value="Current Month">Current Month</option>
                <option value="Last Month">Last Month</option>
                <option value="Last 3 Months">Last 3 Months</option>
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
          <div className="w-[135px] shrink-0">
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
              type="date"
              id="fdate"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              onClick={(e) => {
                try {
                  e.target.showPicker();
                } catch (err) {}
              }}
              className="w-full bg-[#FFFFFF] border border-[#ced4da] rounded-[4px] px-[10px] h-[35px] text-[14.4px] text-[#495057] outline-none cursor-pointer"
            />
          </div>

          {/* To Date */}
          <div className="w-[135px] shrink-0">
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
              type="date"
              id="tdate"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              onClick={(e) => {
                try {
                  e.target.showPicker();
                } catch (err) {}
              }}
              className="w-full bg-[#FFFFFF] border border-[#ced4da] rounded-[4px] px-[10px] h-[35px] text-[14.4px] text-[#495057] outline-none cursor-pointer"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Apply Filters */}
            <button
              onClick={handleApplyFilters}
              className="bg-[#007BFF] hover:bg-[#0069d9] text-white px-3.5 h-[35px] rounded-[4px] flex items-center gap-1.5 font-medium transition-colors cursor-pointer border border-[#007bff]"
            >
              <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                <path d="M2.5 4C2.5 3.44772 2.94772 3 3.5 3H20.5C21.0523 3 21.5 3.44772 21.5 4C21.5 4.30472 21.3638 4.5936 21.1287 4.7876L14.5 10.25V18.25C14.5 18.5724 14.3444 18.8724 14.0799 19.0601L10.5799 21.5601C10.0984 21.904 9.5 21.5594 9.5 20.9702V10.25L2.87132 4.7876C2.63616 4.5936 2.5 4.30472 2.5 4Z" />
              </svg>
              <span>Apply Filters</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="bg-[#6c757d] hover:bg-[#5a6268] text-white px-3.5 h-[35px] rounded-[4px] flex items-center gap-1.5 font-medium transition-colors cursor-pointer border border-[#6c757d]"
            >
              <svg className="w-3.5 h-3.5 stroke-white fill-none" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Reset</span>
            </button>
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
        {/* Control Toolbar Row (div.row) */}
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
                onChange={(e) => setRecordsPerPage(e.target.value)}
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

          {/* Left Arrow Pair */}
          <div
            className="flex items-center shrink-0"
            style={{ marginLeft: '30px' }}
          >
            <div
              className="flex items-center rounded overflow-hidden shadow-xs"
              style={{
                width: '49.89px',
                height: '27.7px',
                backgroundColor: '#8d9aa6',
                borderRadius: '4px',
              }}
            >
              {/* First Page (<<) */}
              <button
                disabled={currentPage === 1 || totalCount === 0}
                onClick={() => setCurrentPage(1)}
                className="hover:bg-[#7b8894] disabled:opacity-85 flex items-center justify-center transition-colors h-full"
                style={{
                  width: '24.44px',
                  height: '27.7px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title="First Page"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="white">
                  <path d="M5.5 1L0.5 5.5L5.5 10V1ZM10.5 1L5.5 5.5L10.5 10V1Z" />
                </svg>
              </button>
              {/* Divider */}
              <div style={{ width: '1px', height: '14px', backgroundColor: '#6c7985' }}></div>
              {/* Prev Page (<) */}
              <button
                disabled={currentPage === 1 || totalCount === 0}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="hover:bg-[#7b8894] disabled:opacity-85 flex items-center justify-center transition-colors h-full"
                style={{
                  width: '24.44px',
                  height: '27.7px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title="Previous Page"
              >
                <svg width="6" height="11" viewBox="0 0 6 11" fill="white">
                  <path d="M5.5 1L0.5 5.5L5.5 10V1Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Page Status */}
          <span
            id="get_items5_pager_info"
            className="pagedisplay select-none font-bold shrink-0 flex items-center"
            style={{
              color: '#212529',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: '12.96px',
              padding: '0px 10px',
              whiteSpace: 'nowrap',
              margin: 0,
            }}
          >
            {totalCount === 0 ? '0 to 0 (0)' : `${(currentPage - 1) * Number(recordsPerPage) + 1} to ${Math.min(currentPage * Number(recordsPerPage), totalCount)} (${totalCount})`}
          </span>

          {/* Right Arrow Pair */}
          <div
            className="flex items-center shrink-0"
          >
            <div
              className="flex items-center rounded overflow-hidden shadow-xs"
              style={{
                width: '49.89px',
                height: '27.7px',
                backgroundColor: '#8d9aa6',
                borderRadius: '4px',
              }}
            >
              {/* Next Page (>) */}
              <button
                disabled={totalCount === 0 || currentPage * Number(recordsPerPage) >= totalCount}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="hover:bg-[#7b8894] disabled:opacity-85 flex items-center justify-center transition-colors h-full"
                style={{
                  width: '24.44px',
                  height: '27.7px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title="Next Page"
              >
                <svg width="6" height="11" viewBox="0 0 6 11" fill="white">
                  <path d="M0.5 1L5.5 5.5L0.5 10V1Z" />
                </svg>
              </button>
              {/* Divider */}
              <div style={{ width: '1px', height: '14px', backgroundColor: '#6c7985' }}></div>
              {/* Last Page (>>) */}
              <button
                disabled={totalCount === 0 || currentPage * Number(recordsPerPage) >= totalCount}
                onClick={() => setCurrentPage(Math.ceil(totalCount / Number(recordsPerPage)) || 1)}
                className="hover:bg-[#7b8894] disabled:opacity-85 flex items-center justify-center transition-colors h-full"
                style={{
                  width: '24.44px',
                  height: '27.7px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                }}
                title="Last Page"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="white">
                  <path d="M0.5 1L5.5 5.5L0.5 10V1ZM5.5 1L10.5 5.5L5.5 10V1Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Export to CSV */}
          <button
            id="csv"
            className="btn btn-info btn-sm font-bold uppercase tracking-wide transition-colors shrink-0"
            onClick={exportToCSV}
            style={{
              color: '#FFFFFF',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: '12.6px',
              backgroundColor: '#17A2B8',
              margin: '0px 0px 0px 16px',
              padding: '3.6px 7.2px',
              height: '27.7px',
              borderRadius: '4px',
              border: '1px solid transparent',
              cursor: 'pointer',
              outline: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            TO CSV
          </button>

          {/* Export to Excel */}
          <button
            id="excel"
            className="btn btn-warning btn-sm font-bold uppercase tracking-wide transition-colors shrink-0"
            onClick={exportToExcel}
            style={{
              color: '#212529',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: '12.6px',
              backgroundColor: '#FFC107',
              margin: '0px 0px 0px 8px',
              padding: '3.6px 7.2px',
              height: '27.7px',
              borderRadius: '4px',
              border: '1px solid transparent',
              cursor: 'pointer',
              outline: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            TO EXCEL
          </button>
        </div>

        {/* Main Data Table */}
        <div className="border border-[#dee2e6] rounded overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#EEEEEE] text-[#212529] font-bold border-b border-[#dee2e6]">
                {/* S.No */}
                <th className="border-r border-[#dee2e6] p-0 text-center font-bold" style={{ width: '80px', minWidth: '70px', height: '38px' }}>
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
                
                {/* Bill No */}
                <th
                  className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                  onClick={() => handleSort('billNo')}
                  style={{ width: '160px', minWidth: '130px', height: '38px' }}
                >
                  <div
                    className="tablesorter-header-inner"
                    style={{
                      color: '#212529',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13.5px',
                      padding: '8px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      position: 'relative',
                      textAlign: 'center',
                    }}
                  >
                    <span>Bill No</span>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                      {renderSortIcon('billNo')}
                    </div>
                  </div>
                </th>

                {/* Date */}
                <th
                  className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                  onClick={() => handleSort('date')}
                  style={{ width: '150px', minWidth: '120px', height: '38px' }}
                >
                  <div
                    className="tablesorter-header-inner"
                    style={{
                      color: '#212529',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13.5px',
                      padding: '8px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      position: 'relative',
                      textAlign: 'center',
                    }}
                  >
                    <span>Date</span>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                      {renderSortIcon('date')}
                    </div>
                  </div>
                </th>

                {/* Product Name (Expansive Column) */}
                <th className="border-r border-[#dee2e6] p-0 text-center font-bold" style={{ height: '38px' }}>
                  <div
                    className="tablesorter-header-inner"
                    style={{
                      color: '#212529',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13.5px',
                      padding: '8px 15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      textAlign: 'center',
                    }}
                  >
                    Product Name
                  </div>
                </th>

                {/* Qty */}
                <th
                  className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                  onClick={() => handleSort('qty')}
                  style={{ width: '130px', minWidth: '100px', height: '38px' }}
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
                    <span>Qty</span>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                      {renderSortIcon('qty')}
                    </div>
                  </div>
                </th>

                {/* Batch */}
                <th
                  className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                  onClick={() => handleSort('batch')}
                  style={{ width: '150px', minWidth: '120px', height: '38px' }}
                >
                  <div
                    className="tablesorter-header-inner"
                    style={{
                      color: '#212529',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13.5px',
                      padding: '8px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      position: 'relative',
                      textAlign: 'center',
                    }}
                  >
                    <span>Batch</span>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                      {renderSortIcon('batch')}
                    </div>
                  </div>
                </th>

                {/* Exp Date */}
                <th
                  className="p-0 cursor-pointer select-none font-bold"
                  onClick={() => handleSort('expDate')}
                  style={{ width: '150px', minWidth: '120px', height: '38px' }}
                >
                  <div
                    className="tablesorter-header-inner"
                    style={{
                      color: '#212529',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '13.5px',
                      padding: '8px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '38px',
                      position: 'relative',
                      textAlign: 'center',
                    }}
                  >
                    <span>Exp Date</span>
                    <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
                      {renderSortIcon('expDate')}
                    </div>
                  </div>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-gray-500 text-[13px] bg-white">
                    No Data Found
                  </td>
                </tr>
              ) : (
                sortedData.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-[#dee2e6] hover:bg-[#f8f9fa] transition-colors text-[13px]"
                  >
                    <td className="py-2.5 px-3 text-center text-gray-600 border-r border-[#dee2e6]">
                      {(currentPage - 1) * Number(recordsPerPage) + index + 1}
                    </td>
                    <td className="py-2.5 px-3 text-gray-700 font-medium border-r border-[#dee2e6]">{row.billNo}</td>
                    <td className="py-2.5 px-3 text-gray-600 border-r border-[#dee2e6]">{row.date}</td>
                    <td className="py-2.5 px-4 text-gray-800 border-r border-[#dee2e6]">{row.productName}</td>
                    <td className="py-2.5 px-3 text-center text-gray-700 font-medium border-r border-[#dee2e6]">{row.qty}</td>
                    <td className="py-2.5 px-3 text-gray-600 border-r border-[#dee2e6]">{row.batch}</td>
                    <td className="py-2.5 px-3 text-gray-600">{row.expDate}</td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Table Footer: Total Quantity */}
            <tfoot>
              <tr className="bg-[#EEEEEE] text-[#212529] font-bold border-t border-[#dee2e6]">
                <td colSpan={4} className="py-2.5 px-4 text-right">
                  Total Quantity
                </td>
                <td className="py-2.5 px-3 text-center text-[#212529]">
                  {totalQuantity}
                </td>
                <td colSpan={2} className="py-2.5 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full text-center py-6 mt-4 text-[12px] text-[#6c757d] select-none font-sans">
        Copyright &copy; NIGSOFT Private Ltd
      </div>
    </div>
  );
}
