'use client';

import React from 'react';
import { useTableStore } from '@/contexts/tableStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Split, Undo2, AlertCircle } from 'lucide-react';

interface TableSplitToolProps {
  className?: string;
}

export function TableSplitTool({ className }: TableSplitToolProps) {
  const { selectedTable, splitTable } = useTableStore();

  const handleSplit = () => {
    if (selectedTable && selectedTable.childIds) {
      const success = splitTable(selectedTable.id);
      if (!success) {
        // Handle error - could show toast notification
        console.error('Failed to split table');
      }
    }
  };

  const isMergedTable = selectedTable?.childIds && selectedTable.childIds.length > 0;
  const originalTables = selectedTable?.metadata?.originalTables as any[] || [];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center">
          <Split className="h-4 w-4 mr-2" />
          Split Table
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!selectedTable ? (
          <p className="text-xs text-gray-500">
            Select a merged table to split
          </p>
        ) : !isMergedTable ? (
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-3 w-3 text-gray-400 mt-0.5" />
              <p className="text-xs text-gray-500">
                {selectedTable.label || selectedTable.id} is not a merged table
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-medium">
                Split {selectedTable.label || selectedTable.id} back into:
              </p>
              
              <div className="space-y-1">
                {originalTables.map((table, index) => (
                  <div
                    key={table.id || index}
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

            <div className="p-2 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-700">
                Tables will be restored to their original positions and properties
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleSplit}
              className="w-full"
              variant="outline"
            >
              <Undo2 className="h-3 w-3 mr-1" />
              Split Table
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TableSplitTool;
