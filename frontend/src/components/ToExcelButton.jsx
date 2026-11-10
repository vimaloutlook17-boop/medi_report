import React from 'react';

export default function ToExcelButton({ className = "", onClick }) {
  return (
    <button 
      id="download_excel"
      onClick={onClick}
      className={`btn btn-sm btn-warning bg-[#FFC107] hover:bg-[#e0a800] text-[#212529] rounded-[3px] border border-transparent flex items-center justify-center transition-colors cursor-pointer ${className}`}
      style={{
        color: '#212529',
        backgroundColor: '#FFC107',
        fontSize: '12.6px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        height: '27.7px',
        padding: '3.6px 7.2px',
        border: 'none',
        borderRadius: '3px'
      }}
    >
      TO EXCEL
    </button>
  );
}
