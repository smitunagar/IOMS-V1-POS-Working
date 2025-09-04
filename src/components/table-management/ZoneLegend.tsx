'use client';

import React from 'react';
import { useTableStore } from '@/contexts/tableStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Plus, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ZoneLegendProps {
  className?: string;
  onCreateZone?: () => void;
  onEditZone?: (zoneId: string) => void;
}

export function ZoneLegend({ className, onCreateZone, onEditZone }: ZoneLegendProps) {
  const { zones, toggleZoneVisibility, getTablesInZone } = useTableStore();

  const handleToggleVisibility = (zoneId: string) => {
    toggleZoneVisibility(zoneId);
  };

  return (
    <div className={cn('bg-white rounded-lg border shadow-sm p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Zones</h3>
        {onCreateZone && (
          <Button
            size="sm"
            variant="outline"
            onClick={onCreateZone}
            className="h-7 px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Zone
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {zones.map((zone) => {
          const tableCount = getTablesInZone(zone.id).length;
          
          return (
            <div
              key={zone.id}
              className={cn(
                'flex items-center justify-between p-2 rounded-md border transition-all',
                zone.visible 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-gray-100 border-gray-300 opacity-60'
              )}
            >
              <div className="flex items-center space-x-2 flex-1">
                {/* Zone color indicator */}
                <div
                  className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: zone.color }}
                />
                
                {/* Zone name and table count */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      'text-sm font-medium',
                      zone.visible ? 'text-gray-900' : 'text-gray-500'
                    )}>
                      {zone.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {tableCount} table{tableCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {/* Toggle visibility */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleVisibility(zone.id)}
                  className="h-7 w-7 p-0"
                  title={zone.visible ? 'Hide zone' : 'Show zone'}
                >
                  {zone.visible ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                </Button>

                {/* Edit zone */}
                {onEditZone && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditZone(zone.id)}
                    className="h-7 w-7 p-0"
                    title="Edit zone"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {zones.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No zones created yet</p>
            {onCreateZone && (
              <Button
                size="sm"
                variant="outline"
                onClick={onCreateZone}
                className="mt-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create your first zone
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Zone Statistics */}
      {zones.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>
              <span className="font-medium">{zones.length}</span> zones
            </div>
            <div>
              <span className="font-medium">
                {zones.filter(z => z.visible).length}
              </span> visible
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ZoneLegend;
