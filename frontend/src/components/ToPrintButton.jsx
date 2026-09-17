import React from 'react';

export default function ToPrintButton({ className = "", onClick }) {
  return (
    <button 
      id="toprint"
      onClick={onClick}
      className={`form-control-sm btn btn-sm btn-info ml-2 bg-[#17A2B8] hover:bg-[#138496] text-[#FFFFFF] rounded-[3px] border border-transparent flex items-center justify-center transition-colors cursor-pointer ${className}`}
      style={{
        color: '#FFFFFF',
        backgroundColor: '#17A2B8',
        fontSize: '12.6px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        height: '28.1px',
        padding: '3.6px 7.2px',
        margin: '0px 0px 0px 7.2px',
        border: 'none',
        borderRadius: '3px'
      }}
    >
      TO Print
    </button>
  );
}
