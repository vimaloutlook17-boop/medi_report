import React, { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({
  id,
  label,
  value,
  onChange,
  placeholder = '-- Select --',
  minChars = 0,
  minCharsMessage,
  options = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block font-semibold text-[12.96px] text-[#212529] mb-1"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {label}
        </label>
      )}

      {/* Main Select Button / Display Box */}
      <div
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-white border border-[#ced4da] rounded-[4px] px-[10.8px] h-[35px] text-[14.4px] text-[#495057] cursor-pointer select-none focus:outline-none focus:border-[#80bdff]"
      >
        <span className={`truncate ${!value ? 'text-[#6c757d]' : 'text-[#495057]'}`}>
          {value || placeholder}
        </span>
        <span className="ml-2 text-gray-500 text-[10px] pointer-events-none">▼</span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[100%] mt-[2px] bg-white border border-[#ced4da] rounded-[4px] shadow-lg z-50 overflow-hidden">
          {/* Search Input inside Dropdown */}
          <div className="p-1.5 border-b border-[#e9ecef]">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1 text-[13px] border border-[#ced4da] rounded outline-none focus:border-[#80bdff]"
            />
          </div>

          {/* Options List */}
          <ul className="max-h-48 overflow-y-auto m-0 p-0 list-none select2-custom-scrollbar text-[13px] text-[#212529]">
            {minChars > 0 && search.length > 0 && search.length < minChars ? (
              <li className="px-3 py-2 text-gray-500 italic text-[12px]">
                {minCharsMessage || `Please enter ${minChars} or more characters`}
              </li>
            ) : filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-gray-500 italic text-[12px]">No results found</li>
            ) : (
              filteredOptions.map((option, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelect(option)}
                  className={`px-3 py-1.5 cursor-pointer hover:bg-[#007BFF] hover:text-white transition-colors ${
                    value === option ? 'bg-[#007BFF] text-white font-medium' : ''
                  }`}
                >
                  {option}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
