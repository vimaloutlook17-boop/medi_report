import React, { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({
  id,
  label,
  value,
  onChange,
  placeholder = '-- Select --',
  minChars = 1,
  minCharsMessage,
  options = [],
  onSearch = null,
  width = '200px',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dynamicOptions, setDynamicOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

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
      setHighlightedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (onSearch) {
      if (minChars > 0 && search.length < minChars) {
        setDynamicOptions([]);
        return;
      }
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const res = await onSearch(search);
          setDynamicOptions(Array.isArray(res) ? res : []);
          setHighlightedIndex(0);
        } catch (err) {
          console.error(err);
          setDynamicOptions([]);
        } finally {
          setIsSearching(false);
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [search, isOpen, onSearch, minChars]);

  const displayOptions = (minChars > 0 && search.length < minChars)
    ? []
    : onSearch
    ? dynamicOptions
    : options.filter((opt) => {
        const text = typeof opt === 'object' ? (opt.label || opt.name || '') : String(opt);
        return text && text !== '0' && text !== '0.00' && text.toLowerCase().includes(search.toLowerCase());
      });

  // Ensure highlighted index stays in bounds when display options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [displayOptions.length, search]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current && displayOptions.length > 0) {
      const activeEl = listRef.current.children[highlightedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen, displayOptions.length]);

  const getDisplayValue = () => {
    if (!value) return '';
    if (typeof value === 'object') {
      return value.label || value.name || '';
    }
    return String(value);
  };

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearch('');
  };

  const isOptionSelected = (option) => {
    if (!value) return false;
    if (typeof value === 'object' && typeof option === 'object') {
      return value.id === option.id;
    }
    return value === option;
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (displayOptions.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % displayOptions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (displayOptions.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + displayOptions.length) % displayOptions.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (displayOptions.length > 0 && displayOptions[highlightedIndex]) {
        handleSelect(displayOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const isPlaceholder = !value || value === placeholder || value === 'Search Product...' || value === '-- Select --';

  return (
    <div className="relative" style={{ width: width || '200px' }} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block font-bold text-[13.5px] text-[#212529]"
          style={{
            fontFamily: 'Arial, -apple-system, sans-serif',
            margin: '0px 0px 4px 0px'
          }}
        >
          {label}
        </label>
      )}

      <span
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`select2-selection select2-selection--single relative flex items-center bg-white border border-[#ced4da] cursor-pointer select-none outline-none focus:border-[#80bdff] ${
          isOpen ? 'rounded-t-[4px] border-b-[#ced4da]' : 'rounded-[4px]'
        }`}
        style={{ width: width || '200px', height: '35px', padding: '3px', display: 'flex', alignItems: 'center' }}
      >
        <span 
          id={id ? `select2-${id}-container` : undefined} 
          className={`select2-selection__rendered ${
            isPlaceholder ? 'select2-selection__placeholder text-[#999999]' : 'text-[#212529]'
          } truncate inline-block h-[28px] leading-[28px]`}
          style={{
            boxSizing: 'border-box',
            width: '100%',
            height: '28px',
            lineHeight: '28px',
            padding: '0px 20px 0px 8px',
            fontSize: '12.96px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            color: isPlaceholder ? '#999999' : '#212529'
          }}
          role="textbox"
          aria-readonly="true"
        >
          {getDisplayValue() || placeholder}
        </span>
        <div className="absolute right-[8px] top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          {/* Only show the clear 'x' if a real option is selected */}
          {value && value !== placeholder && value !== 'Search Product...' && value !== '-- Select --' && (
            <span 
              className="mr-1 text-[13px] font-bold text-[#6c757d] hover:text-[#dc3545] cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation(); // Prevent dropdown toggle
                onChange('');        // Clear the selection
                setIsOpen(false);
              }}
            >
              ×
            </span>
          )}
          <span className="text-[#888888] text-[8px] pointer-events-none">
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </span>

      {/* Dropdown Menu (Select2 Style) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[100%] bg-white border border-t-0 border-[#ced4da] rounded-b-[4px] shadow-md z-50 overflow-hidden" style={{ width: width || '200px' }}>
          {/* Search Input inside Dropdown */}
          <div className="p-[5px]">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-[6px] py-[3px] text-[13px] border border-black rounded-[2px] outline-none text-[#212529] bg-white"
            />
          </div>

          {/* Message / Results List */}
          <div className="pb-1 text-[13px] text-[#212529]">
            {minChars > 0 && search.length < minChars ? (
              <div className="px-2.5 py-1.5 text-[13px] text-[#212529] select-none font-sans">
                {minCharsMessage || `Please enter ${minChars} or more characters`}
              </div>
            ) : isSearching ? (
              <div className="px-2.5 py-1.5 text-[#6c757d] italic text-[12.5px] select-none font-sans">
                Searching...
              </div>
            ) : displayOptions.length === 0 ? (
              <div className="px-2.5 py-1.5 text-[#6c757d] italic text-[12.5px] select-none font-sans">
                No results found
              </div>
            ) : (
              <ul
                ref={listRef}
                className="max-h-48 overflow-y-auto m-0 p-0 list-none text-[13px] text-[#212529]"
              >
                {displayOptions.map((option, idx) => {
                  const labelText = typeof option === 'object' ? (option.label || option.name) : option;
                  const selected = isOptionSelected(option);
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <li
                      key={idx}
                      onClick={() => handleSelect(option)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`px-3 py-1.5 cursor-pointer transition-colors ${
                        isHighlighted
                          ? 'bg-[#5897fb] text-white font-normal'
                          : selected
                          ? 'bg-[#e4e4e4] text-[#212529] font-medium'
                          : 'text-[#212529] hover:bg-[#5897fb] hover:text-white'
                      }`}
                    >
                      {labelText}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
