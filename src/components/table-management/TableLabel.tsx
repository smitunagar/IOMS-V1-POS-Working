'use client';

import React from 'react';
import { useTableStore } from '@/contexts/tableStore';
import { cn } from '@/lib/utils';

interface TableLabelProps {
  tableId: string;
  className?: string;
}

export function TableLabel({ tableId, className }: TableLabelProps) {
  const { getTableById } = useTableStore();
  const table = getTableById(tableId);

  if (!table) return null;

  return (
    <div
      className={cn(
        'text-center text-sm font-medium text-gray-700 pointer-events-none select-none',
        'flex flex-col items-center justify-center gap-1',
        className
      )}
    >
      <div className="font-semibold text-xs">
        {table.label}
      </div>
      <div className="text-xs text-gray-500">
        Seats: {table.seats}
      </div>
    </div>
  );
}
