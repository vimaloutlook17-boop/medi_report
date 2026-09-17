import React from 'react';

export default function PaginationControls({ page = 0, setPage = () => {}, size = 10, totalCount = 0 }) {
  const totalPages = Math.ceil(totalCount / size);
  const isFirstPage = page === 0 || totalCount === 0;
  const isLastPage = page >= totalPages - 1 || totalCount === 0;

  return (
    <>
      <div className="flex items-center ml-[10px]">
        <button onClick={() => setPage(0)} disabled={isFirstPage} className="bg-[#9FA5AA] text-white w-[28.98px] h-[28.09px] py-[3.6px] px-[7.2px] rounded-l-[3px] border border-[#8a9198] cursor-pointer flex items-center justify-center relative z-10 disabled:cursor-default">
          <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 16" className="h-[12px] w-auto" fill="currentColor">
            <polygon points="18,0 9,8 18,16" />
            <polygon points="9,0 0,8 9,16" />
          </svg>
        </button>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={isFirstPage} className="bg-[#9FA5AA] text-white w-[22.69px] h-[28.09px] py-[3.6px] px-[7.2px] rounded-r-[3px] border border-[#8a9198] ml-[-1px] cursor-pointer flex items-center justify-center relative disabled:cursor-default">
          <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 16" className="h-[12px] w-auto" fill="currentColor">
            <polygon points="10,0 0,8 10,16" />
          </svg>
        </button>
      </div>
      
      <span className="px-[5px] font-bold text-[#212529] text-[12.96px] whitespace-nowrap">
        {totalCount === 0 ? 0 : (page * size) + 1} to {Math.min((page + 1) * size, totalCount)} ({totalCount})
      </span>
      
      <div className="flex items-center">
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={isLastPage} className="bg-[#9FA5AA] text-white w-[22.69px] h-[28.09px] py-[3.6px] px-[7.2px] rounded-l-[3px] border border-[#8a9198] cursor-pointer flex items-center justify-center relative z-10 disabled:cursor-default">
          <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 16" className="h-[12px] w-auto" fill="currentColor">
            <polygon points="0,0 10,8 0,16" />
          </svg>
        </button>
        <button onClick={() => setPage(Math.max(0, totalPages - 1))} disabled={isLastPage} className="bg-[#9FA5AA] text-white w-[28.98px] h-[28.09px] py-[3.6px] px-[7.2px] rounded-r-[3px] border border-[#8a9198] ml-[-1px] cursor-pointer flex items-center justify-center relative disabled:cursor-default">
          <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 16" className="h-[12px] w-auto" fill="currentColor">
            <polygon points="0,0 9,8 0,16" />
            <polygon points="9,0 18,8 9,16" />
          </svg>
        </button>
      </div>
    </>
  );
}
