import React from 'react';

export default function ToPdfButton({ onClick, className = '' }) {
  return (
    <button
      id="pdf"
      onClick={onClick}
      className={`btn btn-danger btn-sm bg-[#dc3545] hover:bg-[#c82333] text-white rounded-[3px] outline-none flex items-center justify-center font-normal ${className}`}
      style={{
        height: '27.7px',
        padding: '3.6px 7.2px',
        fontSize: '12.6px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}
    >
      TO PDF
    </button>
  );
}
