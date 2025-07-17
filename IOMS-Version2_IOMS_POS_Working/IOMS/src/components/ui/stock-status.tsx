// Stock Status Component for Menu Items
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

interface StockStatusProps {
  stockStatus: 'available' | 'low-stock' | 'out-of-stock';
  isExpiring?: boolean;
  estimatedServings?: number;
  className?: string;
}

export function StockStatus({ stockStatus, isExpiring, estimatedServings, className }: StockStatusProps) {
  if (stockStatus === 'out-of-stock') {
    return (
      <Badge variant="destructive" className={className}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        Out of Stock
      </Badge>
    );
  }

  if (stockStatus === 'low-stock') {
    return (
      <Badge variant="secondary" className={`${className} bg-yellow-500 text-white`}>
        <AlertTriangle className="w-3 h-3 mr-1" />
        Low Stock
      </Badge>
    );
  }

  if (isExpiring) {
    return (
      <Badge variant="secondary" className={`${className} bg-orange-500 text-white`}>
        <Clock className="w-3 h-3 mr-1" />
        Expiring Soon
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`${className} bg-green-50 text-green-700 border-green-200`}>
      <CheckCircle className="w-3 h-3 mr-1" />
      Available
      {estimatedServings && estimatedServings < 999 && (
        <span className="ml-1">({estimatedServings})</span>
      )}
    </Badge>
  );
}

interface StockIndicatorDotProps {
  stockStatus: 'available' | 'low-stock' | 'out-of-stock';
  isExpiring?: boolean;
  className?: string;
}

export function StockIndicatorDot({ stockStatus, isExpiring, className }: StockIndicatorDotProps) {
  const baseClasses = "w-3 h-3 rounded-full border-2 border-white shadow-sm";
  
  let colorClasses = "";
  if (stockStatus === 'out-of-stock') {
    colorClasses = "bg-red-500";
  } else if (stockStatus === 'low-stock') {
    colorClasses = "bg-yellow-500";
  } else if (isExpiring) {
    colorClasses = "bg-orange-500";
  } else {
    colorClasses = "bg-green-500";
  }

  return (
    <div className={`${baseClasses} ${colorClasses} ${className}`} />
  );
}
