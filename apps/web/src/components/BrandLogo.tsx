'use client';
import { useState } from 'react';
import { getBrandLogo, getBrandColor } from '../config/carBrands';

interface BrandLogoProps {
  brand: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function BrandLogo({ brand, size = 'md', className = '' }: BrandLogoProps) {
  const [imageError, setImageError] = useState(false);
  const logoUrl = getBrandLogo(brand);
  const brandColor = getBrandColor(brand);

  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-14 h-14 text-sm',
    lg: 'w-20 h-20 text-lg',
    xl: 'w-28 h-28 text-2xl',
  };

  // Get brand initials for fallback (max 2 characters)
  const initials = brand.length <= 3
    ? brand.toUpperCase()
    : brand.substring(0, 2).toUpperCase();

  // If we have a logo URL and it hasn't errored, show the image
  if (logoUrl && !imageError) {
    return (
      <div
        className={`${sizeClasses[size]} ${className} rounded-xl flex items-center justify-center overflow-hidden bg-white shadow-md ring-2 ring-white ring-opacity-50 transition-transform hover:scale-105 p-2`}
      >
        <img
          src={logoUrl}
          alt={`${brand} logo`}
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback to colored badge with initials
  return (
    <div
      className={`${sizeClasses[size]} ${className} rounded-xl flex items-center justify-center font-bold shadow-md ring-2 ring-white ring-opacity-50 transition-transform hover:scale-105`}
      style={{
        backgroundColor: brandColor,
        color: 'white',
      }}
    >
      <span className="drop-shadow-sm">{initials}</span>
    </div>
  );
}
