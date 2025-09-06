'use client';

import React from 'react';
import { useTableStore, type Table as TableNodeType, type Zone } from '@/contexts/tableStore';
import { cn } from '@/lib/utils';

interface TableNodeProps {
  table: TableNodeType;
  isSelected: boolean;
  zone?: Zone;
  hasValidationError: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function TableNode({ 
  table, 
  isSelected, 
  zone,
  hasValidationError,
  onMouseDown
}: TableNodeProps) {
  const { selectTable } = useTableStore();

  const handleClick = () => {
    selectTable(table.id);
  };

  // Get shape-specific styles
  const getShapeStyles = () => {
    const baseStyles = {
      width: table.w,
      height: table.h,
      left: table.x,
      top: table.y,
    };

    switch (table.shape) {
      case 'round':
        return {
          ...baseStyles,
          borderRadius: '50%',
        };
      case 'square':
        return {
          ...baseStyles,
          borderRadius: '8px',
        };
      case 'rect':
        return {
          ...baseStyles,
          borderRadius: '12px',
        };
      default:
        return {
          ...baseStyles,
          borderRadius: '8px',
        };
    }
  };

  // Get status color
  const getStatusColor = () => {
    switch (table.status) {
      case 'available':
        return 'bg-green-100 border-green-300 hover:bg-green-200 text-green-800';
      case 'occupied':
        return 'bg-blue-100 border-blue-300 hover:bg-blue-200 text-blue-800';
      case 'cleaning':
        return 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-800';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200 text-yellow-800';
      default:
        return 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700';
    }
  };

  const shapeStyles = getShapeStyles();

  return (
    <div
      className={cn(
        'absolute cursor-pointer border-2 transition-all duration-150 flex flex-col items-center justify-center text-xs font-semibold select-none',
        getStatusColor(),
        isSelected && 'ring-2 ring-blue-500 ring-offset-2 z-10',
        hasValidationError && 'border-red-500 bg-red-100 animate-pulse',
        zone && 'shadow-md'
      )}
      style={{
        ...shapeStyles,
        borderColor: zone?.color || undefined,
        boxShadow: zone ? `0 0 0 2px ${zone.color}20` : undefined
      }}
      onMouseDown={onMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
      }}
      data-testid="table-node"
      data-table-id={table.label}
      data-width={table.w}
      data-height={table.h}
    >
      {/* Table Label */}
      <div className="table-label font-bold text-center leading-tight">
        {table.label}
      </div>
      
      {/* Capacity */}
      <div className="text-xs opacity-75">
        {table.capacity} seats
      </div>

      {/* Zone indicator */}
      {zone && (
        <div 
          className="absolute -top-2 -left-2 w-4 h-4 rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: zone.color }}
          title={`Zone: ${zone.name}`}
        />
      )}

      {/* Status indicator */}
      <div className={cn(
        "absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white shadow-sm",
        table.status === 'available' && 'bg-green-500',
        table.status === 'occupied' && 'bg-blue-500', 
        table.status === 'reserved' && 'bg-yellow-500',
        table.status === 'cleaning' && 'bg-gray-500'
      )} />

      {/* Resize handles - only show when selected */}
      {isSelected && (
        <>
          {/* Bottom-right resize handle */}
          <div 
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize hover:bg-blue-600 transition-colors"
            data-testid="resize-handle-br"
          />
        </>
      )}
    </div>
  );
}
