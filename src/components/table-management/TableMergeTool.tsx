'use client';

import React, { useState } from 'react';
import { useTableStore } from '@/contexts/tableStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Combine, Split, Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TableMergeToolProps {
  className?: string;
}

export function TableMergeTool({ className }: TableMergeToolProps) {
  const {
    tables,
    selectedTable,
    selectTable,
    mergeTables,
    canMergeTables,
    getAdjacentTables,
  } = useTableStore();

  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);

  const handleStartMerge = () => {
    setMergeMode(true);
    setSelectedForMerge([]);
  };

  const handleCancelMerge = () => {
    setMergeMode(false);
    setSelectedForMerge([]);
  };

  const handleTableSelect = (tableId: string) => {
    if (!mergeMode) return;

    if (selectedForMerge.includes(tableId)) {
      setSelectedForMerge(prev => prev.filter(id => id !== tableId));
    } else if (selectedForMerge.length < 2) {
      setSelectedForMerge(prev => [...prev, tableId]);
    }
  };

  const handleMerge = () => {
    if (selectedForMerge.length === 2) {
      const [table1Id, table2Id] = selectedForMerge;
      const mergedId = mergeTables(table1Id, table2Id);
      
      if (mergedId) {
        selectTable(mergedId);
        handleCancelMerge();
      }
    }
  };

  const canMergeSelected = selectedForMerge.length === 2 && 
    canMergeTables(selectedForMerge[0], selectedForMerge[1]);

  // Get adjacent tables for the currently selected table
  const adjacentTables = selectedTable ? getAdjacentTables(selectedTable.id) : [];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center">
          <Combine className="h-4 w-4 mr-2" />
          Merge Tables
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!mergeMode ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              Combine adjacent tables for larger groups
            </p>
            
            {selectedTable && adjacentTables.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium">
                  Adjacent to {selectedTable.label || selectedTable.id}:
                </p>
                <div className="space-y-1">
                  {adjacentTables.map(table => (
                    <div
                      key={table.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                    >
                      <span>{table.label || table.id}</span>
                      <Badge variant="outline" className="text-xs">
                        {table.capacity} seats
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                {selectedTable 
                  ? 'No adjacent tables found'
                  : 'Select a table to see merge options'
                }
              </p>
            )}

            <Button
              size="sm"
              onClick={handleStartMerge}
              disabled={tables.length < 2}
              className="w-full"
            >
              <Combine className="h-3 w-3 mr-1" />
              Start Merge Mode
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Select 2 tables to merge</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelMerge}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-1 max-h-32 overflow-y-auto">
              {tables.filter(t => !t.childIds).map(table => {
                const isSelected = selectedForMerge.includes(table.id);
                const isSelectable = selectedForMerge.length < 2 || isSelected;
                
                return (
                  <div
                    key={table.id}
                    onClick={() => handleTableSelect(table.id)}
                    className={cn(
                      'flex items-center justify-between p-2 rounded cursor-pointer text-xs transition-colors',
                      isSelected 
                        ? 'bg-blue-100 border border-blue-300' 
                        : isSelectable
                        ? 'bg-gray-50 hover:bg-gray-100'
                        : 'bg-gray-100 opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        'w-3 h-3 rounded border',
                        isSelected 
                          ? 'bg-blue-500 border-blue-500' 
                          : 'border-gray-300'
                      )}>
                        {isSelected && <Check className="h-2 w-2 text-white" />}
                      </div>
                      <span>{table.label || table.id}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {table.capacity} seats
                    </Badge>
                  </div>
                );
              })}
            </div>

            {selectedForMerge.length === 2 && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-start space-x-2">
                  {canMergeSelected ? (
                    <Check className="h-3 w-3 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5" />
                  )}
                  <div className="text-xs">
                    {canMergeSelected ? (
                      <span className="text-green-700">
                        Tables can be merged (adjacent)
                      </span>
                    ) : (
                      <span className="text-yellow-700">
                        Tables must be adjacent to merge
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button
              size="sm"
              onClick={handleMerge}
              disabled={!canMergeSelected}
              className="w-full"
            >
              <Combine className="h-3 w-3 mr-1" />
              Merge Selected Tables
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TableMergeTool;
