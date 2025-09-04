'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTableStore } from '@/contexts/tableStore';
import { TableNode } from '@/components/table-management/TableNode';
import { GridLayer } from '@/components/table-management/GridLayer';

export function FloorEditorCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    tables,
    zones,
    selectedTableId,
    selectTable,
    moveTable,
    nudgeTable,
    addTable,
    validationErrors
  } = useTableStore();

  const CANVAS_SIZE = { width: 1200, height: 800 };
  const GRID_SIZE = 8;

  const selectedTable = tables.find(t => t.id === selectedTableId);

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    tableId: string | null;
    startPos: { x: number; y: number };
    offset: { x: number; y: number };
  }>({
    isDragging: false,
    tableId: null,
    startPos: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTable) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          nudgeTable(selectedTable.id, 'left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          nudgeTable(selectedTable.id, 'right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          nudgeTable(selectedTable.id, 'up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          nudgeTable(selectedTable.id, 'down');
          break;
        case 'Escape':
          e.preventDefault();
          selectTable(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTable, nudgeTable, selectTable]);

  // Handle mouse events for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent, tableId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setDragState({
      isDragging: true,
      tableId,
      startPos: { x: mouseX, y: mouseY },
      offset: {
        x: mouseX - table.x,
        y: mouseY - table.y,
      },
    });

    selectTable(tableId);
  }, [tables, selectTable]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.tableId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const table = tables.find(t => t.id === dragState.tableId);
    if (!table) return;

    const newX = Math.max(0, Math.min(
      CANVAS_SIZE.width - table.w,
      mouseX - dragState.offset.x
    ));
    const newY = Math.max(0, Math.min(
      CANVAS_SIZE.height - table.h,
      mouseY - dragState.offset.y
    ));

    moveTable(dragState.tableId, newX, newY);
  }, [dragState, moveTable, tables]);

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      tableId: null,
      startPos: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
    });
  }, []);

  // Handle canvas click (deselect table)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectTable(null);
    }
  }, [selectTable]);

  // Handle double click to add table
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      addTable({ x, y, shape: 'round' });
    }
  }, [addTable]);

  return (
    <div className="flex-1 relative bg-white overflow-hidden">
      <div
        ref={canvasRef}
        className="relative w-full h-full cursor-default"
        style={{ 
          minWidth: CANVAS_SIZE.width, 
          minHeight: CANVAS_SIZE.height,
          backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`
        }}
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid Layer */}
        <GridLayer gridSize={GRID_SIZE} />

        {/* Table Nodes */}
        {tables.map((table) => {
          const zone = zones.find(z => z.id === table.zone);
          const isSelected = table.id === selectedTableId;
          const hasValidationError = validationErrors.length > 0;
          
          return (
            <TableNode
              key={table.id}
              table={table}
              isSelected={isSelected}
              zone={zone}
              hasValidationError={hasValidationError}
              onMouseDown={(e) => handleMouseDown(e, table.id)}
            />
          );
        })}

        {/* Selection Overlay */}
        {selectedTable && (
          <div
            className="absolute border-2 border-blue-500 pointer-events-none rounded"
            style={{
              left: selectedTable.x - 2,
              top: selectedTable.y - 2,
              width: selectedTable.w + 4,
              height: selectedTable.h + 4,
            }}
          />
        )}
      </div>
    </div>
  );
  }, [selectTable]);

  return (
    <div className="relative bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden">
      <div
        ref={canvasRef}
        className="relative cursor-crosshair"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          backgroundImage: snapToGrid 
            ? `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`
            : 'none',
          backgroundSize: snapToGrid ? `${gridSize}px ${gridSize}px` : 'auto',
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid Layer */}
        <GridLayer />

        {/* Zone indicators */}
        {zones
          .filter(zone => zone.visible)
          .map(zone => {
            const tablesInZone = tables.filter(t => t.zoneId === zone.id);
            if (tablesInZone.length === 0) return null;

            // Calculate zone bounds
            const minX = Math.min(...tablesInZone.map(t => t.x));
            const minY = Math.min(...tablesInZone.map(t => t.y));
            const maxX = Math.max(...tablesInZone.map(t => t.x + t.w));
            const maxY = Math.max(...tablesInZone.map(t => t.y + t.h));

            return (
              <div
                key={zone.id}
                className="absolute pointer-events-none border-2 border-dashed rounded-lg"
                style={{
                  left: minX - 10,
                  top: minY - 30,
                  width: maxX - minX + 20,
                  height: maxY - minY + 40,
                  borderColor: zone.color,
                  backgroundColor: `${zone.color}10`,
                }}
              >
                <div
                  className="absolute -top-6 left-2 px-2 py-1 rounded text-xs font-semibold"
                  style={{
                    backgroundColor: zone.color,
                    color: 'white',
                  }}
                >
                  {zone.name}
                </div>
              </div>
            );
          })}

        {/* Tables */}
        {tables.map((table) => (
          <TableNode
            key={table.id}
            table={table}
            isSelected={selectedTable?.id === table.id}
            isDragging={dragState.isDragging && dragState.tableId === table.id}
            onMouseDown={(e) => handleMouseDown(e, table.id)}
            onClick={() => selectTable(table.id)}
          />
        ))}

        {/* Drag Controller */}
        <DragController />
      </div>
      
      {/* Canvas info */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
        {tables.length} tables • {canvasSize.width}×{canvasSize.height}px
        {snapToGrid && ` • Grid: ${gridSize}px`}
      </div>
    </div>
  );
}
