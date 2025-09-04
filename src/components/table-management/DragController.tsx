'use client';

import React from 'react';
import { useTableStore } from '@/contexts/tableStore';

export function DragController() {
  const { isDragging, selectedTable } = useTableStore();

  if (!isDragging || !selectedTable) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Drag guidelines */}
      <div 
        className="absolute border-l-2 border-dashed border-blue-400 opacity-60"
        style={{
          left: selectedTable.x + selectedTable.w / 2,
          top: 0,
          height: '100%',
        }}
      />
      <div 
        className="absolute border-t-2 border-dashed border-blue-400 opacity-60"
        style={{
          top: selectedTable.y + selectedTable.h / 2,
          left: 0,
          width: '100%',
        }}
      />
      
      {/* Position indicator */}
      <div
        className="absolute bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg"
        style={{
          left: selectedTable.x + selectedTable.w + 10,
          top: selectedTable.y,
        }}
      >
        {selectedTable.x}, {selectedTable.y}
      </div>
    </div>
  );
}
