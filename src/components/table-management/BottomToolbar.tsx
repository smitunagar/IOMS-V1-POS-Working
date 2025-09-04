'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useTableStore } from '@/contexts/tableStore';
import { 
  Circle, 
  Square, 
  Rectangle,
  Plus
} from 'lucide-react';

export function BottomToolbar() {
  const { addTable } = useTableStore();

  const handleAddTable = (shape: 'round' | 'square' | 'rect') => {
    // Add table at center of canvas with slight randomization
    const x = 300 + Math.random() * 100;
    const y = 200 + Math.random() * 100;
    addTable({ x, y, shape });
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={() => handleAddTable('round')}
        variant="outline"
        className="w-full justify-start"
        size="sm"
      >
        <Circle className="h-4 w-4 mr-2" />
        Round Table
      </Button>
      
      <Button
        onClick={() => handleAddTable('square')}
        variant="outline"
        className="w-full justify-start"
        size="sm"
      >
        <Square className="h-4 w-4 mr-2" />
        Square Table
      </Button>
      
      <Button
        onClick={() => handleAddTable('rect')}
        variant="outline"
        className="w-full justify-start"
        size="sm"
      >
        <Rectangle className="h-4 w-4 mr-2" />
        Rectangle Table
      </Button>
    </div>
  );
} 