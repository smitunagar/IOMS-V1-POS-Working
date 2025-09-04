'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Settings, Save, RotateCcw, Play, Upload, Download, Sparkles, Grid3x3, AlertTriangle, Layout, Clock, CheckCircle, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
interface Table {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'square' | 'round';
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'dirty';
  label: string;
}

export default function TableManagementPage() {
  // Simple button components for the interface
  const SaveDraftButton = () => (
    <Button variant="outline" size="sm" className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200">
      <Save className="w-4 h-4 mr-1" />
      Save Draft
    </Button>
  );

  const ActivateLayoutButton = () => (
    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
      <Play className="w-4 h-4 mr-1" />
      Activate
    </Button>
  );

  const ResetLayoutButton = () => (
    <Button variant="outline" size="sm" className="bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 border-red-200">
      <RotateCcw className="w-4 h-4 mr-1" />
      Reset
    </Button>
  );

  const ImportLayoutButton = () => (
    <Button variant="outline" size="sm" className="bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border-indigo-200">
      <Upload className="w-4 h-4 mr-1" />
      Import
    </Button>
  );

  const ExportLayoutButton = () => (
    <Button variant="outline" size="sm" className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200">
      <Download className="w-4 h-4 mr-1" />
      Export
    </Button>
  );

  const AIOptimizeButton = () => (
    <Button variant="outline" size="sm" className="bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border-yellow-200">
      <Sparkles className="w-4 h-4 mr-1" />
      AI Optimize
    </Button>
  );
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTool, setSelectedTool] = useState<'select' | 'table'>('select');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [layoutName, setLayoutName] = useState('Default Layout');
  const [zones] = useState<any[]>([]); // Initialize zones as empty array
  const [validationErrors] = useState<string[]>([]); // Initialize validation errors as empty array
  const [isDraftMode] = useState<boolean>(false); // Initialize draft mode
  const [history] = useState<any[]>([]); // Initialize history as empty array
  const [activeTab, setActiveTab] = useState('editor'); // Initialize active tab state

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const response = await fetch('/api/tables');
      if (response.ok) {
        const data = await response.json();
        setTables(data.tables || []);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTables = async () => {
    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tables }),
      });
      
      if (response.ok) {
        alert('Layout saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save tables:', error);
    }
  const addTable = () => {
    const newTable: Table = {
      id: `table-${Date.now()}`,
      x: 100,
      y: 100,
      width: 80,
      height: 80,
      shape: 'round',
      capacity: 4,
      status: 'available',
      label: `T${tables.length + 1}`
    };
    
    setTables(prev => [...prev, newTable]);
  };

  const updateTable = (updatedTable: Table) => {
    setTables(prev => prev.map(table => 
      table.id === updatedTable.id ? updatedTable : table
    ));
  };

  const deleteTable = (tableId: string) => {
    setTables(prev => prev.filter(table => table.id !== tableId));
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
  };

  const resetLayout = () => {
    if (confirm('Are you sure you want to reset the layout? This will remove all tables.')) {
      setTables([]);
      setSelectedTable(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Table Management
              </h1>
              <Input
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                className="w-64 bg-white/50 border-gray-200/50"
                placeholder="Layout name"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={selectedTool === 'select' ? 'default' : 'outline'}
                onClick={() => setSelectedTool('select')}
                className="transition-all duration-200"
              >
                Select
              </Button>
              <Button
                variant={selectedTool === 'table' ? 'default' : 'outline'}
                onClick={() => setSelectedTool('table')}
                className="transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
              <div className="w-px h-6 bg-gray-300" />
              <Button
                variant="outline"
                onClick={resetLayout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <SaveDraftButton_new onSave={saveTables} />
              <ActivateLayoutButton tables={tables} layoutName={layoutName} />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 p-4">
            <Card className="h-full bg-white/60 backdrop-blur-sm border-gray-200/50 shadow-lg">
              <CardContent className="p-0 h-full">
                <FloorEditorCanvas_new
                  tables={tables}
                  selectedTool={selectedTool}
                  selectedTable={selectedTable}
                  onTableSelect={setSelectedTable}
                  onTableUpdate={updateTable}
                  onTableAdd={addTable}
                  onTableDelete={deleteTable}
                />
              </CardContent>
            </Card>
          </div>

          {/* Properties Panel */}
          {selectedTable && (
            <div className="w-80 p-4 border-l border-gray-200/50 bg-white/40 backdrop-blur-sm">
              <Card className="bg-white/80 backdrop-blur-sm border-gray-200/50">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    Table Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Table Label
                    </label>
                    <Input
                      value={selectedTable.label}
                      onChange={(e) => updateTable({
                        ...selectedTable,
                        label: e.target.value
                      })}
                      className="bg-white/50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacity
                    </label>
                    <Input
                      type="number"
                      value={selectedTable.capacity}
                      onChange={(e) => updateTable({
                        ...selectedTable,
                        capacity: parseInt(e.target.value) || 1
                      })}
                      min="1"
                      max="20"
                      className="bg-white/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shape
                    </label>
                    <div className="flex space-x-2">
                      <Button
                        variant={selectedTable.shape === 'round' ? 'default' : 'outline'}
                        onClick={() => updateTable({
                          ...selectedTable,
                          shape: 'round'
                        })}
                        className="flex-1"
                      >
                        Round
                      </Button>
                      <Button
                        variant={selectedTable.shape === 'square' ? 'default' : 'outline'}
                        onClick={() => updateTable({
                          ...selectedTable,
                          shape: 'square'
                        })}
                        className="flex-1"
                      >
                        Square
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedTable.status}
                      onChange={(e) => updateTable({
                        ...selectedTable,
                        status: e.target.value as Table['status']
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white/50"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="reserved">Reserved</option>
                      <option value="dirty">Needs Cleaning</option>
                    </select>
                  </div>

                  <Button
                    variant="destructive"
                    onClick={() => deleteTable(selectedTable.id)}
                    className="w-full"
                  >
                    Delete Table
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-6">
              <span>Total Tables: {tables.length}</span>
              <span>Available: {tables.filter(t => t.status === 'available').length}</span>
              <span>Occupied: {tables.filter(t => t.status === 'occupied').length}</span>
              <span>Reserved: {tables.filter(t => t.status === 'reserved').length}</span>
            </div>
            <div className="text-xs text-gray-500">
              Click and drag to move tables • Double-click to edit properties
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

  const [activeTab, setActiveTab] = useState('editor');
  const [showHelp, setShowHelp] = useState(false);

  // Add table functions
  const addRoundTable = () => {
    addTable({
      x: 100,
      y: 100,
      w: 60,
      h: 60,
      shape: 'circle',
      capacity: 4,
      number: tables.length + 1,
      status: 'available'
    });
  };

  const addSquareTable = () => {
    addTable({
      x: 100,
      y: 100,
      w: 60,
      h: 60,
      shape: 'square',
      capacity: 4,
      number: tables.length + 1,
      status: 'available'
    });
  };

  const addRectangleTable = () => {
    addTable({
      x: 100,
      y: 100,
      w: 100,
      h: 60,
      shape: 'rectangle',
      capacity: 6,
      number: tables.length + 1,
      status: 'available'
    });
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg">
                  <Grid3x3 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Table Management
                  </h1>
                  <p className="text-sm text-gray-600">Design your restaurant floor layout</p>
                </div>
              </div>
              
              {/* Header Stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{tables.length}</div>
                    <div className="text-xs text-gray-600">Tables</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{zones.length}</div>
                    <div className="text-xs text-gray-600">Zones</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {tables.reduce((sum, table) => sum + table.capacity, 0)}
                    </div>
                    <div className="text-xs text-gray-600">Capacity</div>
                  </div>
                </div>
                
                <Separator orientation="vertical" className="h-8" />
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Activate Layout
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div className="flex items-center gap-2 mt-3">
              {validationErrors.length > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {validationErrors.length} Errors
                </Badge>
              )}
              
              {isDraftMode ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Draft Mode
                </Badge>
              ) : (
                <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3" />
                  Active Layout
                </Badge>
              )}
              
              <Badge variant="outline" className="text-xs">
                {history.length} Actions in History
              </Badge>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
            
            {/* Left Sidebar - Tools */}
            <div className="col-span-3">
              <Card className="h-full bg-white/60 backdrop-blur-sm border-gray-200/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Floor Designer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="editor" className="text-xs">Editor</TabsTrigger>
                      <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="editor" className="space-y-4 mt-0">
                      {/* Quick Actions */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Quick Actions
                        </h3>
                        <div className="flex gap-2">
                          <Button 
                            onClick={undo}
                            disabled={!canUndo}
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                          >
                            <Undo2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            onClick={redo}
                            disabled={!canRedo}
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                          >
                            <Redo2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            onClick={clearCanvas}
                            variant="outline" 
                            size="sm"
                            className="flex-1"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Add Tables */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Add Tables
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            onClick={addRoundTable}
                            variant="outline"
                            size="sm"
                            className="h-12 flex flex-col gap-1"
                          >
                            <Circle className="w-4 h-4" />
                            <span className="text-xs">Round</span>
                          </Button>
                          <Button
                            onClick={addSquareTable}
                            variant="outline"
                            size="sm"
                            className="h-12 flex flex-col gap-1"
                          >
                            <Square className="w-4 h-4" />
                            <span className="text-xs">Square</span>
                          </Button>
                          <Button
                            onClick={addRectangleTable}
                            variant="outline"
                            size="sm"
                            className="h-12 flex flex-col gap-1"
                          >
                            <RectangleHorizontal className="w-4 h-4" />
                            <span className="text-xs">Rectangle</span>
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Table Status Legend */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700">Status Legend</h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-green-500"></div>
                            <span>Available</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-blue-500"></div>
                            <span>Occupied</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-yellow-500"></div>
                            <span>Reserved</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-red-500"></div>
                            <span>Out of Service</span>
                          </div>
                        </div>
                      </div>

                    </TabsContent>
                    
                    <TabsContent value="tools" className="space-y-4 mt-0">
                      {/* Advanced Tools */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Advanced Tools
                        </h3>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <Merge className="w-4 h-4 mr-2" />
                            Merge Tables
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <Split className="w-4 h-4 mr-2" />
                            Split Tables
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <QrCode className="w-4 h-4 mr-2" />
                            Generate QR Codes
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <Calendar className="w-4 h-4 mr-2" />
                            Reservation Link
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      {/* Export/Import */}
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700">Export/Import</h3>
                        <div className="space-y-2">
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <Download className="w-4 h-4 mr-2" />
                            Export Layout
                          </Button>
                          <Button variant="outline" size="sm" className="w-full justify-start">
                            <Upload className="w-4 h-4 mr-2" />
                            Import Layout
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                </CardContent>
              </Card>
            </div>

            {/* Main Canvas Area */}
            <div className="col-span-6">
              <Card className="h-full bg-white/60 backdrop-blur-sm border-gray-200/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Grid3X3 className="w-5 h-5" />
                      Floor Layout Canvas
                    </CardTitle>
                    <div className="text-sm text-gray-500">
                      1200 × 800px
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[calc(100%-5rem)]">
                  <FloorEditorCanvas />
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar - Properties */}
            <div className="col-span-3">
              <Card className="h-full bg-white/60 backdrop-blur-sm border-gray-200/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Table Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTable ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Table Number</label>
                        <input 
                          type="number" 
                          value={selectedTable.number}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Capacity</label>
                        <input 
                          type="number" 
                          value={selectedTable.capacity}
                          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Shape</label>
                        <div className="mt-1 text-sm text-gray-600 capitalize">
                          {selectedTable.shape}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Position</label>
                        <div className="mt-1 text-sm text-gray-600">
                          X: {selectedTable.x}px, Y: {selectedTable.y}px
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                        <svg viewBox="0 0 64 64" fill="currentColor">
                          <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <circle cx="32" cy="32" r="4" fill="currentColor"/>
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        Select a table to edit its properties
                      </h3>
                      <p className="text-xs text-gray-500">
                        Click any table on the canvas to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
