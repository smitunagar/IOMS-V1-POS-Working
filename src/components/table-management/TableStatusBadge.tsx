'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TableState } from '@/lib/stores/tableStore';

interface TableStatusBadgeProps {
  status: TableState['status'];
  className?: string;
}

export function TableStatusBadge({ status, className }: TableStatusBadgeProps) {
  const getStatusInfo = (status: TableState['status']) => {
    switch (status) {
      case 'FREE':
        return {
          label: 'Available',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
        };
      case 'SEATED':
        return {
          label: 'Occupied',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
        };
      case 'RESERVED':
        return {
          label: 'Reserved',
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200'
        };
      case 'DIRTY':
        return {
          label: 'Dirty',
          variant: 'outline' as const,
          className: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200'
        };
      default:
        return {
          label: 'Unknown',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-300'
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <Badge 
      variant={statusInfo.variant}
      className={cn(
        'text-xs font-medium px-2 py-1 absolute top-1 right-1 z-10',
        statusInfo.className,
        className
      )}
    >
      {statusInfo.label}
    </Badge>
  );
}
