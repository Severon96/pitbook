'use client';
import { useState, useRef, useEffect } from 'react';
import { CAR_BRANDS } from '../config/carBrands';
import BrandLogo from './BrandLogo';

interface BrandSelectProps {
  value: string;
  onChange: (brand: string) => void;
  required?: boolean;
  className?: string;
}

export default function BrandSelect({ value, onChange, required = false, className = '' }: BrandSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter brands based on search term
  const filteredBrands = CAR_BRANDS.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (brandName: string) => {
    onChange(brandName);
    setIsOpen(false);
    setSearchTerm('');
  };

  const selectedBrand = CAR_BRANDS.find(b => b.name === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          value ? 'border-gray-300' : 'border-gray-300 text-gray-500'
        }`}
      >
        <div className="flex items-center gap-2">
          {selectedBrand ? (
            <>
              <BrandLogo brand={selectedBrand.name} size="sm" />
              <span className="text-gray-900">{selectedBrand.name}</span>
            </>
          ) : (
            <span className="text-gray-500">Select a brand</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Brand List */}
          <div className="overflow-y-auto max-h-64">
            {filteredBrands.length > 0 ? (
              filteredBrands.map((brand) => (
                <button
                  key={brand.name}
                  type="button"
                  onClick={() => handleSelect(brand.name)}
                  className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                    value === brand.name ? 'bg-blue-50' : ''
                  }`}
                >
                  <BrandLogo brand={brand.name} size="sm" />
                  <span className="text-gray-900">{brand.name}</span>
                  {value === brand.name && (
                    <svg
                      className="w-5 h-5 text-blue-600 ml-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-gray-500 text-sm">
                No brands found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="text"
          value={value}
          required
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={() => {}}
        />
      )}
    </div>
  );
}
