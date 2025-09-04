'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Users, Move, Square } from 'lucide-react';
import { useTableStore } from '@/lib/stores/tableStore';
import { cn } from '@/lib/utils';

interface TablePropertiesPanelProps {
  className?: string;
}

export function TablePropertiesPanel({ className }: TablePropertiesPanelProps) {
  const { 
    selectedTable, 
    tables, 
    zones,
    getTableById,
    updateTable,
    deleteTable,
    clearSelection,
    addZone,
    updateZone,
    removeZone
  } = useTableStore();

  const table = selectedTable ? getTableById(selectedTable) : null;

  if (!table) {
    return (
      <Card className={cn('w-80 h-fit', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-600">Table Properties</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-500 text-center py-8">
          Select a table to view and edit properties
        </CardContent>
      </Card>
    );
  }

  const handleLabelChange = (value: string) => {
    updateTable(table.id, { label: value });
  };

  const handleCapacityChange = (value: string) => {
    const capacity = parseInt(value);
    if (capacity > 0) {
      updateTable(table.id, { capacity, seats: capacity });
    }
  };

  const handleShapeChange = (shape: 'round' | 'square' | 'rect') => {
    updateTable(table.id, { shape });
  };

  const handleZoneChange = (zoneId: string) => {
    updateTable(table.id, { zoneId: zoneId === 'none' ? undefined : zoneId });
  };

  const handleDeleteTable = () => {
    if (table) {
      deleteTable(table.id);
      clearSelection();
    }
  };

  return (
    <Card className={cn('w-80 h-fit', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">Table Properties</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearSelection}
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Table Label */}
        <div className="space-y-2">
          <Label htmlFor="table-label" className="text-xs font-medium">Table Label</Label>
          <Input
            id="table-label"
            value={table.label || ''}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="Enter table label"
            className="h-8 text-sm"
          />
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          <Label htmlFor="table-capacity" className="text-xs font-medium">Capacity (Seats)</Label>
          <Input
            id="table-capacity"
            type="number"
            min="1"
            max="20"
            value={table.capacity || table.seats || 4}
            onChange={(e) => handleCapacityChange(e.target.value)}
            className="h-8 text-sm"
          />
        </div>

        {/* Shape */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Table Shape</Label>
          <div className="flex gap-2">
            {[
              { shape: 'round' as const, icon: '●', label: 'Round' },
              { shape: 'square' as const, icon: '■', label: 'Square' },
              { shape: 'rect' as const, icon: '▬', label: 'Rectangle' }
            ].map(({ shape, icon, label }) => (
              <Button
                key={shape}
                variant={table.shape === shape ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleShapeChange(shape)}
                className="flex-1 h-8 text-xs"
              >
                <span className="mr-1">{icon}</span>
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Zone Assignment */}
        <div className="space-y-2">
          <Label htmlFor="table-zone" className="text-xs font-medium">Zone</Label>
          <Select 
            value={table.zoneId || 'none'} 
            onValueChange={handleZoneChange}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Zone</SelectItem>
              {zones.map((zone: any) => (
                <SelectItem key={zone.id} value={zone.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border" 
                      style={{ backgroundColor: zone.color }}
                    />
                    {zone.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Position & Size Info */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Position & Size</Label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Move className="w-3 h-3" />
              <span>X: {table.x}px</span>
            </div>
            <div className="flex items-center gap-1">
              <Move className="w-3 h-3" />
              <span>Y: {table.y}px</span>
            </div>
            <div className="flex items-center gap-1">
              <Square className="w-3 h-3" />
              <span>W: {table.w}px</span>
            </div>
            <div className="flex items-center gap-1">
              <Square className="w-3 h-3" />
              <span>H: {table.h}px</span>
            </div>
          </div>
        </div>

        {/* Current Zone Badge */}
        {table.zoneId && (
          <div className="space-y-2">
            <Label className="text-xs font-medium">Current Zone</Label>
            {(() => {
              const zone = zones.find((z: any) => z.id === table.zoneId);
              return zone ? (
                <Badge variant="outline" className="text-xs">
                  <div 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: zone.color }}
                  />
                  {zone.name}
                </Badge>
              ) : null;
            })()}
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDeleteTable}
            className="w-full h-8 text-xs"
          >
            <Trash2 className="w-3 h-3 mr-2" />
            Delete Table
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
