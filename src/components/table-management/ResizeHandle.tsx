'use client';

import React, { useState, useCallback } from 'react';
import { useTableStore } from '@/contexts/tableStore';
import { cn } from '@/lib/utils';

interface ResizeHandleProps {
  tableId: string;
  position: 'bottom-right' | 'bottom' | 'right';
  className?: string;
}

export function ResizeHandle({ tableId, position, className }: ResizeHandleProps) {
  const { getTableById, resizeTable, gridSize } = useTableStore();
  const [isResizing, setIsResizing] = useState(false);

  const table = getTableById(tableId);
  if (!table) return null;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startWidth = table.w;
    const startHeight = table.h;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startMouseX;
      const deltaY = e.clientY - startMouseY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      switch (position) {
        case 'bottom-right':
          newWidth = Math.max(gridSize * 4, startWidth + deltaX);
          newHeight = Math.max(gridSize * 4, startHeight + deltaY);
          break;
        case 'bottom':
          newHeight = Math.max(gridSize * 4, startHeight + deltaY);
          break;
        case 'right':
          newWidth = Math.max(gridSize * 4, startWidth + deltaX);
          break;
      }

      resizeTable(tableId, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [tableId, position, table.w, table.h, resizeTable, gridSize]);

  const getCursor = () => {
    switch (position) {
      case 'bottom-right':
        return 'cursor-nw-resize';
      case 'bottom':
        return 'cursor-ns-resize';
      case 'right':
        return 'cursor-ew-resize';
      default:
        return 'cursor-pointer';
    }
  };

  return (
    <div
      className={cn(
        'w-3 h-3 bg-blue-500 border border-white rounded-sm hover:bg-blue-600 transition-colors z-20',
        getCursor(),
        isResizing && 'bg-blue-600 scale-110',
        className
      )}
      onMouseDown={handleMouseDown}
    />
  );
}
