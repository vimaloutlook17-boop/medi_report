import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchableSelect from '../../../components/SearchableSelect';

// Sample product and customer lists for autocomplete search
const SAMPLE_PRODUCTS = [
  'ADENOSINE 6 MG',
  'AC NEW TABLET',
  'ULTAVIR 30ML',
  'ADRENALLINE 1ML',
  'RANTAC 150MG',
  'ANOZEST CREAM',
  'AZITHROMYCIN 500MG',
  'PARACETAMOL 650MG',
  'AMOXICILLIN 500MG',
  'CETIRIZINE 10MG',
  'DOLO 650MG',
  'PAN 40MG'
];

const SAMPLE_CUSTOMERS = [
  'John Doe',
  'Jane Smith',
  'Robert Brown',
  'Michael Johnson',
  'David Wilson',
  'Sarah Davis',
  'Ramesh Kumar',
  'Suresh Patel',
  'Priya Sharma'
];

// Helper to format date as MM/DD/YYYY
const formatDate = (d) => {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
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
    case 'Current Month': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: formatDate(firstDay), to: formatDate(today) };
    }
    case 'Last Month': {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: formatDate(firstDayLastMonth), to: formatDate(lastDayLastMonth) };
    }
    case 'Last 3 Months': {
      const past3Months = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return { from: formatDate(past3Months), to: formatDate(today) };
    }
    case 'Custom Date':
    default:
      return null;
  }
};

export default function ProductWiseCustomerList() {
  // Filter States
  const [selectedItem, setSelectedItem] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [dateFilter, setDateFilter] = useState('Today');
  const [fromDate, setFromDate] = useState(() => formatDate(new Date()));
  const [toDate, setToDate] = useState(() => formatDate(new Date()));

  // Pagination & Table States
  const [recordsPerPage, setRecordsPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('mobile');
  const [sortOrder, setSortOrder] = useState('desc');

  // Data rows (initial state empty as in screenshot)
  const [data, setData] = useState([]);

  // Calculate total count and total quantity
  const totalCount = data.length;
  const totalQuantity = data.reduce((sum, row) => sum + (Number(row.qty) || 0), 0);

  const handleDateFilterChange = (newFilter) => {
    setDateFilter(newFilter);
    const range = getDateRangeForFilter(newFilter);
    if (range) {
      setFromDate(range.from);
      setToDate(range.to);
    }
  };

  const handleReset = () => {
    const todayStr = formatDate(new Date());
    setSelectedItem('');
    setCustomerName('');
    setDateFilter('Today');
    setFromDate(todayStr);
    setToDate(todayStr);
    setData([]);
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', { selectedItem, customerName, dateFilter, fromDate, toDate });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        return (
          <svg className="w-2.5 h-2.5 text-black shrink-0" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square">
            <path d="M2 6L6 2L10 6" />
          </svg>
        );
      } else {
        return (
          <svg className="w-2.5 h-2.5 text-black shrink-0" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square">
            <path d="M2 2L6 6L10 2" />
          </svg>
        );
      }
    }
    return (
      <svg className="w-2.5 h-3 text-black shrink-0" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square">
        <path d="M2 5.5L6 1.5L10 5.5" />
        <path d="M2 8.5L6 12.5L10 8.5" />
      </svg>
    );
  };

  const exportToCSV = () => {
    if (data.length === 0) {
      alert('No data available to export');
      return;
    }
    const headers = ['S.No', 'Bill No', 'Date', 'Customer Name', 'Mobile', 'Qty', 'Batch', 'Exp Date'];
    const rows = data.map((item, index) => [
      index + 1,
      item.billNo,
      item.date,
      `"${item.customerName || ''}"`,
      item.mobile,
      item.qty,
      item.batch,
      item.expDate
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Product_Wise_Customer_List.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      alert('No data available to export');
      return;
    }
    exportToCSV(); // Fallback CSV export
  };

  const tabs = [
    { label: 'Stocks', path: '/' },
    { label: 'Products Summary', path: '/' },
    { label: 'Low Demand Stock', path: '#' },
    { label: 'Zero Stocks', path: '/zero-stocks' },
    { label: 'Age Wise Stocks', path: '#' },
    { label: 'Low Quantity', path: '#' },
    { label: 'Expired', path: '#' },
    { label: 'Most Wanted', path: '#' },
    { label: 'Approved', path: '#' },
    { label: 'Purchase Return Items', path: '#' },
    { label: 'Stock Report', path: '#' },
    { label: 'Stock Report Batch Wise', path: '/stock-report-batch-wise' },
    { label: 'Category Wise Product', path: '#' },
    { label: 'Transaction Report', path: '#' },
    { label: 'ProductWise Customer', path: '/product-wise-customer', active: true },
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
          fontSize: '25.2px',
          lineHeight: '30.24px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          margin: '15px 0px 12px 0px',
          fontWeight: '500',
          textTransform: 'uppercase',
        }}
      >
        PRODUCT WISE PATIENT LIST
      </h3>

      {/* Filters Card Container */}
      <div
        className="patients-filter-panel"
        style={{
          color: '#212529',
          fontSize: '12.96px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          margin: '36px 0px 14px 0px',
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
            fontSize: '12.96px',
            lineHeight: '19.44px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            margin: '0px 0px 8px 0px',
            fontWeight: '600',
          }}
        >
          <svg className="w-3.5 h-3.5 fill-[#212529]" viewBox="0 0 24 24">
            <path d="M2.5 4C2.5 3.44772 2.94772 3 3.5 3H20.5C21.0523 3 21.5 3.44772 21.5 4C21.5 4.30472 21.3638 4.5936 21.1287 4.7876L14.5 10.25V18.25C14.5 18.5724 14.3444 18.8724 14.0799 19.0601L10.5799 21.5601C10.0984 21.904 9.5 21.5594 9.5 20.9702V10.25L2.87132 4.7876C2.63616 4.5936 2.5 4.30472 2.5 4Z" />
          </svg>
          <span>Filters</span>
        </div>

        {/* Filters Form Row: Single Line Row with all 5 Fields + Apply Filters + Reset Buttons */}
        <div
          className="form-row mt-2 flex flex-nowrap items-end gap-2.5 w-full"
          style={{
            color: '#212529',
            fontSize: '12.96px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          {/* Select Item */}
          <div className="flex-1 min-w-[140px]">
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
          <div className="flex-1 min-w-[140px]">
            <SearchableSelect
              id="select2-search_customer_name-container"
              label="Patient Name"
              value={customerName}
              onChange={(val) => setCustomerName(val)}
              placeholder="Type to search patient..."
              minChars={3}
              minCharsMessage="Please enter 3 or more characters"
              options={SAMPLE_CUSTOMERS}
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
          <div className="w-[110px] shrink-0">
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
              className="form-control"
              type="text"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                color: '#495057',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '14.4px',
                backgroundColor: '#E9ECEF',
                padding: '4px 10.8px',
                height: '35px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>

          {/* To Date */}
          <div className="w-[110px] shrink-0">
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
              className="form-control"
              type="text"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                color: '#495057',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '14.4px',
                backgroundColor: '#E9ECEF',
                padding: '4px 10.8px',
                height: '35px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                outline: 'none',
              }}
            />
          </div>

          {/* Apply Filters Button */}
          <button
            id="applyFilterBtn"
            className="btn btn-primary shrink-0 flex items-center justify-center gap-1.5 font-normal"
            onClick={handleApplyFilters}
            style={{
              color: '#FFFFFF',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: '14.4px',
              backgroundColor: '#007BFF',
              padding: '4px 10.8px',
              height: '35px',
              border: '1px solid transparent',
              borderRadius: '4px',
              cursor: 'pointer',
              outline: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M2.5 4C2.5 3.44772 2.94772 3 3.5 3H20.5C21.0523 3 21.5 3.44772 21.5 4C21.5 4.30472 21.3638 4.5936 21.1287 4.7876L14.5 10.25V18.25C14.5 18.5724 14.3444 18.8724 14.0799 19.0601L10.5799 21.5601C10.0984 21.904 9.5 21.5594 9.5 20.9702V10.25L2.87132 4.7876C2.63616 4.5936 2.5 4.30472 2.5 4Z" />
            </svg>
            <span>Apply Filters</span>
          </button>

          {/* Reset Button */}
          <button
            id="clearFilterBtn"
            className="btn btn-secondary shrink-0 flex items-center justify-center gap-1.5 font-normal"
            onClick={handleReset}
            style={{
              color: '#FFFFFF',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: '14.4px',
              backgroundColor: '#6C757D',
              padding: '4px 10.8px',
              height: '35px',
              border: '1px solid transparent',
              borderRadius: '4px',
              cursor: 'pointer',
              outline: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Control Toolbar (Total Count, Records Per Page, Pagination, Export) */}
      <div className="flex flex-wrap items-center gap-5 my-3 text-[12.5px]">
        {/* Total Count */}
        <h6
          style={{
            color: '#323F52',
            fontSize: '15.84px',
            lineHeight: '19px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            margin: '-5px 0px 0px 0px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>Total Count :</span>
          <span style={{ color: '#0052cc' }}>{totalCount}</span>
        </h6>

        {/* Records Per Page */}
        <div className="flex items-center">
          <h6
            className="records-title"
            style={{
              color: '#323F52',
              fontSize: '15.84px',
              lineHeight: '19px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              margin: '0px 0px 7.2px 30px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
            }}
          >
            Records Per Page
          </h6>
          <div className="relative" style={{ marginLeft: '10px', marginBottom: '7.2px' }}>
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
              }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <div
              className="pointer-events-none"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              <svg className="w-2.5 h-3 text-black" viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square">
                <path d="M2 5.5L6 1.5L10 5.5" />
                <path d="M2 8.5L6 12.5L10 8.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pagination Controls & Export Buttons */}
        <div className="flex items-center" style={{ marginBottom: '7.2px' }}>
          {/* Left Arrow Pair */}
          <div
            className="btn-group btn-group-sm mx-lg-1 mb-2 mb-sm-0"
            role="group"
            style={{
              padding: '0px 0px 0px 30px',
              width: '79.89px',
              height: '27.7px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <div
              className="flex items-center rounded overflow-hidden"
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
                className="hover:bg-[#7b8894] disabled:opacity-90 flex items-center justify-center transition-colors h-full"
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
                <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
                  <path d="M11.5 5.5L4 12L11.5 18.5V5.5ZM19.5 5.5L12 12L19.5 18.5V5.5Z" />
                </svg>
              </button>
              {/* Divider */}
              <div style={{ width: '1px', height: '14px', backgroundColor: '#6c7985' }}></div>
              {/* Prev Page (<) */}
              <button
                disabled={currentPage === 1 || totalCount === 0}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="hover:bg-[#7b8894] disabled:opacity-90 flex items-center justify-center transition-colors h-full"
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
                <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
                  <path d="M15 5.5L7.5 12L15 18.5V5.5Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Page Status */}
          <span
            id="get_items5_pager_info"
            className="pagedisplay mx-1 mx-sm-0 select-none font-bold"
            style={{
              color: '#212529',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: '12.96px',
              padding: '0px 6px',
              whiteSpace: 'nowrap',
            }}
          >
            {totalCount === 0 ? '0 to 0 (0)' : `${(currentPage - 1) * Number(recordsPerPage) + 1} to ${Math.min(currentPage * Number(recordsPerPage), totalCount)} (${totalCount})`}
          </span>

          {/* Right Arrow Pair */}
          <div
            className="btn-group btn-group-sm mx-lg-1 mb-2 mb-sm-0 flex items-center h-[27.7px]"
          >
            <div className="flex items-center bg-[#8d9aa6] rounded overflow-hidden shadow-xs h-[27.7px]">
              {/* Next Page (>) */}
              <button
                disabled={totalCount === 0 || currentPage * Number(recordsPerPage) >= totalCount}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2 hover:bg-[#7b8894] disabled:opacity-90 flex items-center justify-center transition-colors h-full"
                title="Next Page"
              >
                <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
                  <path d="M9 5.5L16.5 12L9 18.5V5.5Z" />
                </svg>
              </button>
              {/* Divider */}
              <div className="w-[1px] h-3.5 bg-[#6c7985]"></div>
              {/* Last Page (>>) */}
              <button
                disabled={totalCount === 0 || currentPage * Number(recordsPerPage) >= totalCount}
                onClick={() => setCurrentPage(Math.ceil(totalCount / Number(recordsPerPage)) || 1)}
                className="px-2 hover:bg-[#7b8894] disabled:opacity-90 flex items-center justify-center transition-colors h-full"
                title="Last Page"
              >
                <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 24 24">
                  <path d="M4.5 5.5L12 12L4.5 18.5V5.5ZM12.5 5.5L20 12L12.5 18.5V5.5Z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Export to CSV */}
          <button
            id="csv"
            className="btn btn-info btn-sm ml-3 font-bold uppercase tracking-wide transition-colors"
            onClick={exportToCSV}
            style={{
              color: '#FFFFFF',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: '12.6px',
              backgroundColor: '#17A2B8',
              margin: '0px 0px 0px 14.4px',
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
            className="btn btn-warning btn-sm font-bold uppercase tracking-wide transition-colors"
            onClick={exportToExcel}
            style={{
              color: '#FFFFFF',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: '12.6px',
              backgroundColor: '#e8a217',
              margin: '0px 0px 0px 7.2px',
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
      </div>

      {/* Main Data Table */}
      <div className="border border-[#dee2e6] rounded overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#f8f9fa] text-[#212529] font-bold border-b border-[#dee2e6]">
              {/* S.No */}
              <th className="border-r border-[#dee2e6] p-0 text-center w-14 font-bold" style={{ height: '28px' }}>
                <div
                  className="tablesorter-header-inner"
                  style={{
                    color: '#212529',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12.96px',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '28px',
                  }}
                >
                  S.No
                </div>
              </th>
              
              {/* Bill No */}
              <th
                className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                onClick={() => handleSort('billNo')}
                style={{ height: '28px' }}
              >
                <div
                  className="tablesorter-header-inner"
                  style={{
                    color: '#212529',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12.96px',
                    padding: '4px 18px 4px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '28px',
                    position: 'relative',
                  }}
                >
                  <span>Bill No</span>
                  <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' }}>
                    {renderSortIcon('billNo')}
                  </div>
                </div>
              </th>

              {/* Date */}
              <th
                className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                onClick={() => handleSort('date')}
                style={{ height: '28px' }}
              >
                <div
                  className="tablesorter-header-inner"
                  style={{
                    color: '#212529',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12.96px',
                    padding: '4px 18px 4px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '28px',
                    position: 'relative',
                  }}
                >
                  <span>Date</span>
                  <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' }}>
                    {renderSortIcon('date')}
                  </div>
                </div>
              </th>

              {/* Patient Name */}
              <th className="border-r border-[#dee2e6] p-0 text-center font-bold" style={{ height: '28px' }}>
                <div
                  className="tablesorter-header-inner"
                  style={{
                    color: '#212529',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12.96px',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '28px',
                  }}
                >
                  Patient Name
                </div>
              </th>

              {/* Mobile */}
              <th
                className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                onClick={() => handleSort('mobile')}
                style={{ height: '28px' }}
              >
                <div
                  className="tablesorter-header-inner"
                  style={{
                    color: '#212529',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12.96px',
                    padding: '4px 18px 4px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '28px',
                    position: 'relative',
                  }}
                >
                  <span>Mobile</span>
                  <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' }}>
                    {renderSortIcon('mobile')}
                  </div>
                </div>
              </th>

              {/* Qty */}
              <th
                className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                onClick={() => handleSort('qty')}
                style={{ height: '28px' }}
              >
                <div
                  className="tablesorter-header-inner"
                  style={{
                    color: '#212529',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12.96px',
                    padding: '4px 18px 4px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '28px',
                    position: 'relative',
                  }}
                >
                  <span>Qty</span>
                  <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' }}>
                    {renderSortIcon('qty')}
                  </div>
                </div>
              </th>

              {/* Batch */}
              <th
                className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                onClick={() => handleSort('batch')}
                style={{ height: '28px' }}
              >
                <div
                  className="tablesorter-header-inner"
                  style={{
                    color: '#212529',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12.96px',
                    padding: '4px 18px 4px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '28px',
                    position: 'relative',
                  }}
                >
                  <span>Batch</span>
                  <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' }}>
                    {renderSortIcon('batch')}
                  </div>
                </div>
              </th>

              {/* Exp Date */}
              <th
                className="p-0 cursor-pointer select-none font-bold"
                onClick={() => handleSort('expDate')}
                style={{ height: '28px' }}
              >
                <div
                  className="tablesorter-header-inner"
                  style={{
                    color: '#212529',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '12.96px',
                    padding: '4px 18px 4px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '28px',
                    position: 'relative',
                  }}
                >
                  <span>Exp Date</span>
                  <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)' }}>
                    {renderSortIcon('expDate')}
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr className="bg-white">
                <td colSpan={8} className="py-6 text-center text-[13px] text-[#495057] font-normal">
                  No Data Found
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="border-b border-[#dee2e6] hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-center text-gray-600 border-r border-[#dee2e6]">{index + 1}</td>
                  <td className="py-2.5 px-3 text-gray-700 font-medium border-r border-[#dee2e6]">{row.billNo}</td>
                  <td className="py-2.5 px-3 text-gray-600 border-r border-[#dee2e6]">{row.date}</td>
                  <td className="py-2.5 px-4 text-gray-800 border-r border-[#dee2e6]">{row.customerName}</td>
                  <td className="py-2.5 px-3 text-gray-600 border-r border-[#dee2e6]">{row.mobile}</td>
                  <td className="py-2.5 px-3 text-center text-gray-700 font-medium border-r border-[#dee2e6]">{row.qty}</td>
                  <td className="py-2.5 px-3 text-gray-600 border-r border-[#dee2e6]">{row.batch}</td>
                  <td className="py-2.5 px-3 text-gray-600">{row.expDate}</td>
                </tr>
              ))
            )}
          </tbody>

          {/* Table Footer: Total Quantity */}
          <tfoot>
            <tr className="bg-[#f8f9fa] text-[#212529] font-bold border-t border-[#dee2e6]">
              <td colSpan={5} className="py-2.5 px-4 text-right">
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
  );
}
