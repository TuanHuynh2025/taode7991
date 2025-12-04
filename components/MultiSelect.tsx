import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Chọn...",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    if (selectedValues.includes(id)) {
      onChange(selectedValues.filter(v => v !== id));
    } else {
      onChange([...selectedValues, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.id));
    }
  };

  return (
    <div className="relative mb-4" ref={wrapperRef}>
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <div 
        className={`w-full bg-white border rounded-md px-3 py-2 text-sm flex justify-between items-center cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'hover:border-teal-500'
        } ${isOpen ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-300'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="truncate text-slate-700">
          {selectedValues.length === 0 
            ? <span className="text-slate-400">{placeholder}</span>
            : `${selectedValues.length} mục đã chọn`
          }
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <div 
            className="px-3 py-2 border-b border-slate-100 hover:bg-teal-50 cursor-pointer text-sm font-semibold text-teal-700 flex items-center gap-2 sticky top-0 bg-white"
            onClick={handleSelectAll}
          >
            <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedValues.length === options.length ? 'bg-teal-600 border-teal-600' : 'border-slate-300'}`}>
               {selectedValues.length === options.length && <Check size={12} className="text-white" />}
            </div>
            Chọn tất cả
          </div>
          {options.length > 0 ? (
            options.map(option => (
              <div 
                key={option.id}
                className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm flex items-start gap-2"
                onClick={() => handleSelect(option.id)}
              >
                <div className={`mt-0.5 w-4 h-4 border rounded flex-shrink-0 flex items-center justify-center ${selectedValues.includes(option.id) ? 'bg-teal-600 border-teal-600' : 'border-slate-300'}`}>
                  {selectedValues.includes(option.id) && <Check size={12} className="text-white" />}
                </div>
                <span className="text-slate-700">{option.name}</span>
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-sm text-slate-400">Không có dữ liệu</div>
          )}
        </div>
      )}
      
      {/* Selected chips preview (optional, for UX) */}
      {selectedValues.length > 0 && selectedValues.length < 5 && (
         <div className="flex flex-wrap gap-1 mt-2">
            {options.filter(o => selectedValues.includes(o.id)).map(o => (
               <span key={o.id} className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded flex items-center gap-1">
                  {o.name.length > 20 ? o.name.substring(0, 20) + '...' : o.name}
                  <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => handleSelect(o.id)} />
               </span>
            ))}
         </div>
      )}
    </div>
  );
};

export default MultiSelect;