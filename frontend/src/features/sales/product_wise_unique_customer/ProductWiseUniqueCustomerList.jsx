import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SearchableSelect from '../../../components/SearchableSelect';
import ToCsvButton from '../../../components/ToCsvButton';
import ToExcelButton from '../../../components/ToExcelButton';
import * as XLSX from 'xlsx';

const API_BASE = '';

import { useAuth } from '../../../AuthContext';

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

export default function ProductWiseUniqueCustomerList() {
  // Filter States
  const [selectedItem, setSelectedItem] = useState('');
  const [patientName, setPatientName] = useState('');
  const [dateFilter, setDateFilter] = useState('Today');
  const [fromDate, setFromDate] = useState(() => formatDate(new Date()));
  const [toDate, setToDate] = useState(() => formatDate(new Date()));

  const { token } = useAuth();

  const searchItems = async (term) => {
    if (!token) return [];
    try {
      const res = await fetch(`${API_BASE}/api/sales/product-wise-customer/search-items?term=${encodeURIComponent(term)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    }
    return [];
  };

  const searchPatients = async (term) => {
    if (!token) return [];
    try {
      const res = await fetch(`${API_BASE}/api/sales/product-wise-customer/search-patients?term=${encodeURIComponent(term)}`, {
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

  // Pagination & Table States
  const [recordsPerPage, setRecordsPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  // Data rows
  const [data, setData] = useState([]);

  const totalCount = data.length;

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
    setPatientName('');
    setDateFilter('Today');
    setFromDate(todayStr);
    setToDate(todayStr);
    setData([]);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', { selectedItem, patientName, dateFilter, fromDate, toDate });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
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
    const headers = ['S.No', 'UHID/Patient ID', 'Patient Name', 'Mobile No', 'Age', 'Address'];
    const rows = data.map((item, index) => [
      index + 1,
      `"${item.uhid || ''}"`,
      `"${item.patientName || ''}"`,
      `"${item.mobile || ''}"`,
      item.age || '',
      `"${item.address || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Product_Wise_Unique_Customer_List.csv');
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
      'S.No': index + 1,
      'UHID/Patient ID': item.uhid || '',
      'Patient Name': item.patientName || '',
      'Mobile No': item.mobile || '',
      'Age': item.age || '',
      'Address': item.address || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Product Wise Unique Customer List");
    XLSX.writeFile(workbook, "Product_Wise_Unique_Customer_List.xlsx");
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
        PRODUCT WISE UNIQUE CUSTOMER LIST
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
              onSearch={searchItems}
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
              onSearch={searchPatients}
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
              id="fdate"
              className="form-control"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              onClick={(e) => {
                try {
                  e.target.showPicker();
                } catch (err) {}
              }}
              style={{
                color: '#495057',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '14.4px',
                backgroundColor: '#FFFFFF',
                padding: '4px 10px',
                height: '35px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                outline: 'none',
                cursor: 'pointer',
              }}
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
              id="tdate"
              className="form-control"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              onClick={(e) => {
                try {
                  e.target.showPicker();
                } catch (err) {}
              }}
              style={{
                color: '#495057',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                fontSize: '14.4px',
                backgroundColor: '#FFFFFF',
                padding: '4px 10px',
                height: '35px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                outline: 'none',
                cursor: 'pointer',
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
                disabled={currentPage === 1 || totalCount === 0 || recordsPerPage === 'All'}
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
                disabled={currentPage === 1 || totalCount === 0 || recordsPerPage === 'All'}
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
            {recordsPerPage === 'All'
              ? (totalCount === 0 ? '0 to 0 (0)' : `1 to ${totalCount} (${totalCount})`)
              : (totalCount === 0 ? '0 to 0 (0)' : `${(currentPage - 1) * Number(recordsPerPage) + 1} to ${Math.min(currentPage * Number(recordsPerPage), totalCount)} (${totalCount})`)}
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
                disabled={totalCount === 0 || recordsPerPage === 'All' || currentPage * Number(recordsPerPage) >= totalCount}
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
                disabled={totalCount === 0 || recordsPerPage === 'All' || currentPage * Number(recordsPerPage) >= totalCount}
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
          <ToCsvButton className="ml-[16px]" onClick={exportToCSV} />

          {/* Export to Excel */}
          <ToExcelButton className="ml-[8px]" onClick={exportToExcel} />
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

              {/* UHID/Patient ID */}
              <th
                className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                onClick={() => handleSort('uhid')}
                style={{ width: '16%', minWidth: '150px', height: '38px' }}
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
                  <span>UHID/Patient ID</span>
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                    {renderSortIcon('uhid')}
                  </div>
                </div>
              </th>

              {/* Patient Name */}
              <th
                className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                onClick={() => handleSort('patientName')}
                style={{ width: '32%', minWidth: '240px', height: '38px' }}
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
                  <span>Patient Name</span>
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                    {renderSortIcon('patientName')}
                  </div>
                </div>
              </th>

              {/* Mobile No */}
              <th
                className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                onClick={() => handleSort('mobile')}
                style={{ width: '15%', minWidth: '130px', height: '38px' }}
              >
                <div
                  className="tablesorter-header-inner"
                  style={{
                    color: '#212529',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '13.5px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '38px',
                    textAlign: 'center',
                  }}
                >
                  <span>Mobile No</span>
                </div>
              </th>

              {/* Age */}
              <th
                className="border-r border-[#dee2e6] p-0 cursor-pointer select-none font-bold"
                onClick={() => handleSort('age')}
                style={{ width: '8%', minWidth: '75px', height: '38px' }}
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
                  <span>Age</span>
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                    {renderSortIcon('age')}
                  </div>
                </div>
              </th>

              {/* Address */}
              <th
                className="p-0 cursor-pointer select-none font-bold"
                onClick={() => handleSort('address')}
                style={{ width: '24%', minWidth: '200px', height: '38px' }}
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
                  <span>Address</span>
                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                    {renderSortIcon('address')}
                  </div>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr className="bg-white">
                <td colSpan={6} className="py-6 text-center text-[13px] text-[#495057] font-normal">
                  No Data Found
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="border-b border-[#dee2e6] hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-center text-gray-600 border-r border-[#dee2e6]">
                    {recordsPerPage === 'All' ? index + 1 : (currentPage - 1) * Number(recordsPerPage) + index + 1}
                  </td>
                  <td className="py-2.5 px-3 text-gray-700 font-medium border-r border-[#dee2e6]">{row.uhid}</td>
                  <td className="py-2.5 px-4 text-gray-800 border-r border-[#dee2e6]">{row.patientName}</td>
                  <td className="py-2.5 px-3 text-gray-600 border-r border-[#dee2e6]">{row.mobile}</td>
                  <td className="py-2.5 px-3 text-center text-gray-700 border-r border-[#dee2e6]">{row.age}</td>
                  <td className="py-2.5 px-3 text-gray-600">{row.address}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Footer pinned to bottom with small subtle font */}
      <footer className="w-full text-center mt-auto pt-10 pb-4 text-[10.8px] text-[#6c757d] select-none font-sans">
        Copyright &copy; NIGSOFT Private Ltd
      </footer>
    </div>
  );
}
