import React from 'react';

export const ApplyFilterButton = ({ onClick, id = "applyFilterBtn", text = "Apply Filters" }) => {
  return (
    <button
      id={id}
      className="btn btn-primary shrink-0 flex items-center justify-center font-medium"
      onClick={onClick}
      style={{
        color: '#FFFFFF',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '14.4px',
        backgroundColor: '#007BFF',
        padding: '4px 10.8px',
        height: '34px',
        margin: '0px',
        border: '1px solid transparent',
        borderRadius: '4px',
        cursor: 'pointer',
        outline: 'none',
        whiteSpace: 'nowrap',
        gap: '6px'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14.4" height="14.4" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-filter">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
      </svg>
      {text}
    </button>
  );
};

export const ResetButton = ({ onClick, id = "clearFilterBtn", text = "Reset" }) => {
  return (
    <button
      id={id}
      className="btn btn-secondary shrink-0 flex items-center justify-center font-medium"
      onClick={onClick}
      style={{
        color: '#FFFFFF',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '14.5px',
        backgroundColor: '#6C757D',
        padding: '6px 12px',
        height: '35px',
        minWidth: '80px',
        border: '1px solid transparent',
        borderRadius: '4px',
        cursor: 'pointer',
        outline: 'none',
        whiteSpace: 'nowrap',
        gap: '6px'
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="feather feather-rotate-ccw">
        <polyline points="1 4 1 10 7 10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
      </svg>
      {text}
    </button>
  );
};
