"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDishes, debugServingsCalculation, debugDishInventoryAlignment } from '@/lib/menuService';
import { getInventory } from '@/lib/inventoryService';

export default function DebugServingsPage() {
  const { currentUser } = useAuth();
  const [debugOutput, setDebugOutput] = useState<string>('');
  const [dishes, setDishes] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      // Override console.log to capture output
      const originalLog = console.log;
      const logs: string[] = [];
      
      console.log = (...args) => {
        logs.push(args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)).join(' '));
        originalLog(...args);
      };

      try {
        const userDishes = getDishes(currentUser.id);
        const userInventory = getInventory(currentUser.id);
        
        setDishes(userDishes);
        setInventory(userInventory);

        // Find Chocolava cake
        const chocolavaDish = userDishes.find(d => 
          d.name.toLowerCase().includes('chocolava') || 
          d.name.toLowerCase().includes('chocolate')
        );

        if (chocolavaDish) {
          logs.push('🔍 ===== DEBUG RESULTS =====');
          logs.push(`Found dish: ${chocolavaDish.name}`);
          logs.push('Running detailed analysis...');
          
          // Run debug
          debugServingsCalculation(currentUser.id, chocolavaDish.name);
        } else {
          logs.push('❌ Chocolava cake not found in menu');
          logs.push('Available dishes:');
          userDishes.forEach(dish => logs.push(`  - ${dish.name}`));
        }

        setDebugOutput(logs.join('\n'));
      } catch (error) {
        logs.push(`❌ Error: ${error}`);
        setDebugOutput(logs.join('\n'));
      }

      // Restore console.log
      console.log = originalLog;
    }
  }, [currentUser]);

  if (!currentUser) {
    return <div className="p-4">Please log in to see debug information</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔍 Servings Debug Analysis</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debug Output */}
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96">
          <h3 className="text-white font-bold mb-2">Debug Output:</h3>
          <pre className="whitespace-pre-wrap">{debugOutput || 'Loading...'}</pre>
        </div>

        {/* Current Data */}
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-bold mb-2">📋 Current Menu ({dishes.length} dishes):</h3>
            <div className="space-y-1 text-sm">
              {dishes.map((dish, i) => (
                <div key={i} className="flex justify-between">
                  <span>{dish.name}</span>
                  <span className="text-gray-500">
                    {Array.isArray(dish.ingredients) ? dish.ingredients.length : 0} ingredients
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded">
            <h3 className="font-bold mb-2">📦 Current Inventory ({inventory.length} items):</h3>
            <div className="space-y-1 text-sm">
              {inventory.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="text-gray-600">{item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 rounded">
        <h3 className="font-bold mb-2">🎯 Quick Actions:</h3>
        <div className="space-x-2">
          <button 
            onClick={() => window.location.reload()} 
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            🔄 Refresh Analysis
          </button>
          <button 
            onClick={() => window.open('/inventory', '_blank')} 
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
          >
            📦 Open Inventory
          </button>
          <button 
            onClick={() => window.open('/', '_blank')} 
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
          >
            🍽️ Open POS
          </button>
        </div>
      </div>
    </div>
  );
}
