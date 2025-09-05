'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Settings, Save, Grid3x3, Layout, BarChart3, Download, Upload, Home, DoorOpen, Square, Circle, Scissors, Users, Calculator, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';

interface Table {
  id: number;
  number: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved' | 'out-of-service';
  zone?: string;
  shape: 'circle' | 'square' | 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Zone {
  id: string;
  name: string;
  color: string;
  tables: number[];
}

interface FloorPlan {
  id: string;
  name: string;
  width: number;  // in feet
  height: number; // in feet
  scale: number;  // pixels per foot
  zones: Zone[];
  fixtures: Fixture[];
  created: Date;
  lastModified: Date;
}

interface Fixture {
  id: string;
  type: 'wall' | 'door' | 'window' | 'bar' | 'kitchen' | 'restroom' | 'entrance';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label?: string;
}

interface FloorAnalytics {
  totalArea: number;        // in sq ft
  tableArea: number;        // area occupied by tables
  walkwayArea: number;      // area for walking
  utilization: number;      // percentage of space used
  capacity: number;         // total seating capacity
  tablesPerSqFt: number;    // efficiency metric
  averageTableSize: number; // average seats per table
}

export default function TableManagementPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeTab, setActiveTab] = useState('layout');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [draggedTable, setDraggedTable] = useState<Table | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 20;
  
  // Floor Plan Management
  const [floorPlan, setFloorPlan] = useState<FloorPlan>({
    id: 'main-floor',
    name: 'Main Dining Area',
    width: 40,  // 40 feet
    height: 30, // 30 feet
    scale: 15,  // 15 pixels per foot
    zones: [],
    fixtures: [],
    created: new Date(),
    lastModified: new Date()
  });
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    loadTableConfiguration();
    
    // Add keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedTable) {
        deleteTable(selectedTable.id);
      }
      if (e.key === 'Escape') {
        setSelectedTable(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveConfiguration();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTable]);

  // Initialize with sample fixtures for demonstration
  useEffect(() => {
    if (fixtures.length === 0) {
      const sampleFixtures: Fixture[] = [
        { id: 'wall-1', type: 'wall', x: 0, y: 0, width: 600, height: 20, rotation: 0, label: 'North Wall' },
        { id: 'wall-2', type: 'wall', x: 0, y: 0, width: 20, height: 450, rotation: 0, label: 'West Wall' },
        { id: 'wall-3', type: 'wall', x: 0, y: 430, width: 600, height: 20, rotation: 0, label: 'South Wall' },
        { id: 'wall-4', type: 'wall', x: 580, y: 0, width: 20, height: 450, rotation: 0, label: 'East Wall' },
        { id: 'entrance-1', type: 'entrance', x: 250, y: 430, width: 100, height: 20, rotation: 0, label: 'Main Entrance' },
        { id: 'kitchen-1', type: 'kitchen', x: 450, y: 50, width: 120, height: 80, rotation: 0, label: 'Kitchen' },
        { id: 'bar-1', type: 'bar', x: 50, y: 50, width: 150, height: 60, rotation: 0, label: 'Bar Area' },
      ];
      setFixtures(sampleFixtures);
    }
  }, []);

  const loadTableConfiguration = () => {
    const defaultTables: Table[] = [
      { id: 1, number: '1', seats: 4, status: 'available', zone: 'main', shape: 'circle', x: 100, y: 100, width: 80, height: 80 },
      { id: 2, number: '2', seats: 2, status: 'occupied', zone: 'main', shape: 'square', x: 200, y: 100, width: 60, height: 60 },
      { id: 3, number: '3', seats: 6, status: 'available', zone: 'patio', shape: 'rectangle', x: 300, y: 100, width: 100, height: 60 },
    ];

    const defaultZones: Zone[] = [
      { id: 'main', name: 'Main Dining', color: '#3b82f6', tables: [1, 2] },
      { id: 'patio', name: 'Patio', color: '#10b981', tables: [3] },
    ];

    setTables(defaultTables);
    setZones(defaultZones);
  };

  const addTable = () => {
    // Find a good position for the new table (avoid overlaps)
    const newId = Math.max(...tables.map(t => t.id), 0) + 1;
    let x = 50;
    let y = 50;
    
    // Try to find an empty spot
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 8; col++) {
        const testX = 50 + col * 100;
        const testY = 50 + row * 100;
        
        const hasOverlap = tables.some(table => {
          const distance = Math.sqrt(Math.pow(table.x - testX, 2) + Math.pow(table.y - testY, 2));
          return distance < 120; // Minimum distance between tables
        });
        
        if (!hasOverlap) {
          x = testX;
          y = testY;
          break;
        }
      }
      if (x !== 50 || y !== 50) break;
    }

    const newTable: Table = {
      id: newId,
      number: `${newId}`,
      seats: 4,
      status: 'available',
      shape: 'circle',
      x,
      y,
      width: 80,
      height: 80
    };
    setTables([...tables, newTable]);
    setSelectedTable(newTable);
  };

  const updateTable = (updatedTable: Table) => {
    setTables(tables.map(t => t.id === updatedTable.id ? updatedTable : t));
  };

  const deleteTable = (tableId: number) => {
    setTables(tables.filter(t => t.id !== tableId));
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
  };

  const saveConfiguration = () => {
    console.log('Saving table configuration...', { tables, zones });
  };

  // Drag and Drop handlers
  const handleMouseDown = (e: React.MouseEvent, table: Table) => {
    e.preventDefault();
    setIsDragging(true);
    setDraggedTable(table);
    setSelectedTable(table);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = e.currentTarget.parentElement?.getBoundingClientRect();
    
    if (containerRect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !draggedTable) return;
    
    e.preventDefault();
    const containerRect = e.currentTarget.getBoundingClientRect();
    
    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;
    
    // Grid snapping
    if (snapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
    }
    
    // Bounds checking
    const maxX = containerRect.width - draggedTable.width;
    const maxY = containerRect.height - draggedTable.height;
    
    const boundedX = Math.max(0, Math.min(newX, maxX));
    const boundedY = Math.max(0, Math.min(newY, maxY));
    
    const updatedTable = { ...draggedTable, x: boundedX, y: boundedY };
    updateTable(updatedTable);
    setDraggedTable(updatedTable);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedTable(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Handle mouse leave to stop dragging if cursor leaves container
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedTable(null);
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Floor Analytics Calculations
  const calculateFloorAnalytics = (): FloorAnalytics => {
    const totalArea = floorPlan.width * floorPlan.height; // sq ft
    const tableArea = tables.reduce((sum, table) => {
      const widthFt = table.width / floorPlan.scale;
      const heightFt = table.height / floorPlan.scale;
      return sum + (widthFt * heightFt);
    }, 0);
    
    const capacity = tables.reduce((sum, table) => sum + table.seats, 0);
    const utilization = (tableArea / totalArea) * 100;
    const walkwayArea = totalArea - tableArea;
    const tablesPerSqFt = tables.length / totalArea;
    const averageTableSize = capacity / tables.length || 0;

    return {
      totalArea,
      tableArea,
      walkwayArea,
      utilization,
      capacity,
      tablesPerSqFt,
      averageTableSize
    };
  };

  // Add Fixture Function
  const addFixture = (type: Fixture['type']) => {
    const newFixture: Fixture = {
      id: `fixture-${Date.now()}`,
      type,
      x: 100,
      y: 100,
      width: type === 'wall' ? 200 : 80,
      height: type === 'wall' ? 20 : 60,
      rotation: 0,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${fixtures.length + 1}`
    };
    setFixtures([...fixtures, newFixture]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-yellow-500';
      case 'out-of-service': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const renderTable = (table: Table) => {
    const isSelected = selectedTable?.id === table.id;
    const beingDragged = draggedTable?.id === table.id;
    const baseClasses = `absolute border-2 cursor-move transition-all duration-200 flex items-center justify-center text-white font-semibold select-none`;
    const shapeClasses = table.shape === 'circle' ? 'rounded-full' : table.shape === 'square' ? 'rounded-lg' : 'rounded-lg';
    const statusClasses = getStatusColor(table.status);
    const selectedClasses = isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300';
    const dragClasses = beingDragged ? 'shadow-lg z-10 scale-105' : '';

    return (
      <div
        key={table.id}
        className={`${baseClasses} ${shapeClasses} ${statusClasses} ${selectedClasses} ${dragClasses}`}
        style={{
          left: table.x,
          top: table.y,
          width: table.width,
          height: table.height,
        }}
        onMouseDown={(e) => handleMouseDown(e, table)}
        title={`Table ${table.number} - ${table.seats} seats - ${table.status}`}
      >
        <span className="text-sm pointer-events-none">{table.number}</span>
      </div>
    );
  };

  const renderFixture = (fixture: Fixture) => {
    const isSelected = selectedFixture?.id === fixture.id;
    const getFixtureStyle = () => {
      switch (fixture.type) {
        case 'wall': return 'bg-gray-800 border-gray-900';
        case 'door': return 'bg-yellow-600 border-yellow-700';
        case 'window': return 'bg-blue-300 border-blue-400';
        case 'bar': return 'bg-amber-700 border-amber-800';
        case 'kitchen': return 'bg-red-600 border-red-700';
        case 'restroom': return 'bg-purple-500 border-purple-600';
        case 'entrance': return 'bg-green-600 border-green-700';
        default: return 'bg-gray-500 border-gray-600';
      }
    };

    return (
      <div
        key={fixture.id}
        className={`absolute border-2 cursor-pointer transition-all duration-200 flex items-center justify-center text-white text-xs font-medium select-none ${getFixtureStyle()} ${isSelected ? 'ring-2 ring-blue-300' : ''}`}
        style={{
          left: fixture.x,
          top: fixture.y,
          width: fixture.width,
          height: fixture.height,
          transform: `rotate(${fixture.rotation}deg)`,
        }}
        onClick={() => setSelectedFixture(fixture)}
        title={fixture.label}
      >
        <span className="pointer-events-none">{fixture.label}</span>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Table Management & Floor Planning</h1>
              <p className="text-gray-600 mt-1">Configure dining area layout, floor plan, and restaurant setup</p>
              <div className="flex gap-6 mt-3 text-sm">
                <div className="flex gap-4 text-gray-500">
                  <span>📏 Floor: {floorPlan.width}×{floorPlan.height} ft ({floorPlan.width * floorPlan.height} sq ft)</span>
                  <span>🪑 Tables: {tables.length}</span>
                  <span>👥 Capacity: {tables.reduce((sum, t) => sum + t.seats, 0)} seats</span>
                </div>
                <div className="flex gap-4 text-gray-500">
                  <span className="text-green-600">Available: {tables.filter(t => t.status === 'available').length}</span>
                  <span className="text-red-600">Occupied: {tables.filter(t => t.status === 'occupied').length}</span>
                  <span className="text-yellow-600">Reserved: {tables.filter(t => t.status === 'reserved').length}</span>
                </div>
                {selectedTable && <span className="text-blue-600 font-medium">Selected: Table {selectedTable.number}</span>}
                {isDragging && <span className="text-orange-600 font-medium">Dragging...</span>}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={saveConfiguration} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Layout
              </Button>
              <Button variant="outline" onClick={addTable}>
                <Plus className="w-4 h-4 mr-2" />
                Add Table
              </Button>
              <Button 
                variant={snapToGrid ? "default" : "outline"} 
                onClick={() => setSnapToGrid(!snapToGrid)}
                size="sm"
              >
                <Grid3x3 className="w-4 h-4 mr-2" />
                Snap to Grid
              </Button>
              <Button 
                variant={showAnalytics ? "default" : "outline"} 
                onClick={() => setShowAnalytics(!showAnalytics)}
                size="sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="layout">Layout Designer</TabsTrigger>
              <TabsTrigger value="floor-setup">Floor Setup</TabsTrigger>
              <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
              <TabsTrigger value="tables">Table List</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="w-5 h-5" />
                    Dining Area Layout ({floorPlan.width}×{floorPlan.height} ft)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Scale and measurements */}
                  <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                    <div>Scale: 1 foot = {floorPlan.scale} pixels</div>
                    <div>Total Area: {(floorPlan.width * floorPlan.height).toLocaleString()} sq ft</div>
                    <div>Grid: {snapToGrid ? `${gridSize}px` : 'Off'}</div>
                  </div>
                  
                  <div 
                    className={`relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 ${snapToGrid ? 'bg-grid' : ''}`}
                    style={{ 
                      height: `${floorPlan.height * floorPlan.scale}px`, 
                      width: `${floorPlan.width * floorPlan.scale}px`,
                      backgroundImage: snapToGrid ? `radial-gradient(circle, #ccc 1px, transparent 1px)` : 'none',
                      backgroundSize: snapToGrid ? `${gridSize}px ${gridSize}px` : 'auto',
                      maxHeight: '600px',
                      maxWidth: '100%',
                      overflow: 'auto'
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Render fixtures first (background layer) */}
                    {fixtures.map(renderFixture)}
                    
                    {/* Render tables (foreground layer) */}
                    {tables.map(renderTable)}
                    
                    {/* Measurement rulers */}
                    <div className="absolute top-0 left-0 w-full h-4 bg-gray-100 border-b flex items-center justify-center text-xs text-gray-600">
                      {floorPlan.width} feet
                    </div>
                    <div className="absolute top-0 left-0 w-4 h-full bg-gray-100 border-r flex items-center justify-center text-xs text-gray-600" style={{ writingMode: 'vertical-lr' }}>
                      {floorPlan.height} feet
                    </div>
                    
                    {tables.length === 0 && fixtures.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Home className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>Start designing your restaurant layout</p>
                          <p className="text-sm">Add tables and fixtures to begin</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {selectedTable && (
                <Card>
                  <CardHeader>
                    <CardTitle>Table Properties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tableNumber">Table Number</Label>
                        <Input
                          id="tableNumber"
                          value={selectedTable.number}
                          onChange={(e) => updateTable({ ...selectedTable, number: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="seats">Seats</Label>
                        <Input
                          id="seats"
                          type="number"
                          value={selectedTable.seats}
                          onChange={(e) => updateTable({ ...selectedTable, seats: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={selectedTable.status} onValueChange={(value: any) => updateTable({ ...selectedTable, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="reserved">Reserved</SelectItem>
                            <SelectItem value="out-of-service">Out of Service</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="shape">Shape</Label>
                        <Select value={selectedTable.shape} onValueChange={(value: any) => updateTable({ ...selectedTable, shape: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="circle">Circle</SelectItem>
                            <SelectItem value="square">Square</SelectItem>
                            <SelectItem value="rectangle">Rectangle</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="positionX">X Position</Label>
                        <Input
                          id="positionX"
                          type="number"
                          value={Math.round(selectedTable.x)}
                          onChange={(e) => updateTable({ ...selectedTable, x: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="positionY">Y Position</Label>
                        <Input
                          id="positionY"
                          type="number"
                          value={Math.round(selectedTable.y)}
                          onChange={(e) => updateTable({ ...selectedTable, y: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => deleteTable(selectedTable.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete Table
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedTable(null)}
                      >
                        Deselect
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      <p>💡 Tips: Drag tables to move them, press Delete to remove selected table, Ctrl+S to save</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tables" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Tables</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tables.map((table) => (
                      <div key={table.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(table.status)}`} />
                          <span className="font-medium">Table {table.number}</span>
                          <Badge variant="secondary">{table.seats} seats</Badge>
                          <Badge variant="outline">{table.status}</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTable(table)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="floor-setup" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Floor Plan Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Basic Information</h3>
                      <div>
                        <Label htmlFor="floorName">Floor Plan Name</Label>
                        <Input
                          id="floorName"
                          value={floorPlan.name}
                          onChange={(e) => setFloorPlan({...floorPlan, name: e.target.value})}
                          placeholder="e.g., Main Dining Area"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="floorWidth">Width (feet)</Label>
                          <Input
                            id="floorWidth"
                            type="number"
                            value={floorPlan.width}
                            onChange={(e) => setFloorPlan({...floorPlan, width: parseInt(e.target.value) || 1})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="floorHeight">Height (feet)</Label>
                          <Input
                            id="floorHeight"
                            type="number"
                            value={floorPlan.height}
                            onChange={(e) => setFloorPlan({...floorPlan, height: parseInt(e.target.value) || 1})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="floorScale">Scale (pixels per foot)</Label>
                        <Input
                          id="floorScale"
                          type="number"
                          value={floorPlan.scale}
                          onChange={(e) => setFloorPlan({...floorPlan, scale: parseInt(e.target.value) || 1})}
                          min="5"
                          max="50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Higher values = larger display size</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">Floor Statistics</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span>Total Area:</span>
                          <span className="font-medium">{(floorPlan.width * floorPlan.height).toLocaleString()} sq ft</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Display Size:</span>
                          <span className="font-medium">{floorPlan.width * floorPlan.scale} × {floorPlan.height * floorPlan.scale} px</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tables:</span>
                          <span className="font-medium">{tables.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fixtures:</span>
                          <span className="font-medium">{fixtures.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Capacity:</span>
                          <span className="font-medium">{tables.reduce((sum, t) => sum + t.seats, 0)} seats</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Restaurant Type Presets</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <Button variant="outline" onClick={() => setFloorPlan({...floorPlan, width: 30, height: 20})}>
                        Small Café (30×20 ft)
                      </Button>
                      <Button variant="outline" onClick={() => setFloorPlan({...floorPlan, width: 50, height: 35})}>
                        Medium Restaurant (50×35 ft)
                      </Button>
                      <Button variant="outline" onClick={() => setFloorPlan({...floorPlan, width: 80, height: 60})}>
                        Large Restaurant (80×60 ft)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fixtures" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Square className="w-5 h-5" />
                    Fixtures & Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Add Fixtures</h3>
                    <div className="grid grid-cols-4 gap-2">
                      <Button variant="outline" size="sm" onClick={() => addFixture('wall')}>
                        <Square className="w-4 h-4 mr-2" />
                        Wall
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addFixture('door')}>
                        <DoorOpen className="w-4 h-4 mr-2" />
                        Door
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addFixture('window')}>
                        <Square className="w-4 h-4 mr-2" />
                        Window
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addFixture('bar')}>
                        <Square className="w-4 h-4 mr-2" />
                        Bar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addFixture('kitchen')}>
                        <Scissors className="w-4 h-4 mr-2" />
                        Kitchen
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addFixture('restroom')}>
                        <Users className="w-4 h-4 mr-2" />
                        Restroom
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => addFixture('entrance')}>
                        <Home className="w-4 h-4 mr-2" />
                        Entrance
                      </Button>
                    </div>
                  </div>

                  {selectedFixture && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Edit Fixture: {selectedFixture.label}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fixtureLabel">Label</Label>
                          <Input
                            id="fixtureLabel"
                            value={selectedFixture.label || ''}
                            onChange={(e) => {
                              const updated = {...selectedFixture, label: e.target.value};
                              setSelectedFixture(updated);
                              setFixtures(fixtures.map(f => f.id === updated.id ? updated : f));
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor="fixtureType">Type</Label>
                          <Select value={selectedFixture.type} onValueChange={(value: any) => {
                            const updated = {...selectedFixture, type: value};
                            setSelectedFixture(updated);
                            setFixtures(fixtures.map(f => f.id === updated.id ? updated : f));
                          }}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="wall">Wall</SelectItem>
                              <SelectItem value="door">Door</SelectItem>
                              <SelectItem value="window">Window</SelectItem>
                              <SelectItem value="bar">Bar</SelectItem>
                              <SelectItem value="kitchen">Kitchen</SelectItem>
                              <SelectItem value="restroom">Restroom</SelectItem>
                              <SelectItem value="entrance">Entrance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 text-red-600"
                        onClick={() => {
                          setFixtures(fixtures.filter(f => f.id !== selectedFixture.id));
                          setSelectedFixture(null);
                        }}
                      >
                        Delete Fixture
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Space Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <div className="text-3xl font-bold text-blue-600">{calculateFloorAnalytics().utilization.toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Space Utilization</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <div className="text-3xl font-bold text-green-600">{calculateFloorAnalytics().capacity}</div>
                          <div className="text-sm text-gray-600">Total Capacity</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Floor Area:</span>
                          <span className="font-medium">{calculateFloorAnalytics().totalArea.toLocaleString()} sq ft</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Table Area:</span>
                          <span className="font-medium">{calculateFloorAnalytics().tableArea.toFixed(1)} sq ft</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Walkway Area:</span>
                          <span className="font-medium">{calculateFloorAnalytics().walkwayArea.toFixed(1)} sq ft</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tables per sq ft:</span>
                          <span className="font-medium">{calculateFloorAnalytics().tablesPerSqFt.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Table Size:</span>
                          <span className="font-medium">{calculateFloorAnalytics().averageTableSize.toFixed(1)} seats</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Efficiency Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="font-medium text-yellow-800">Recommendations</h4>
                        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                          {calculateFloorAnalytics().utilization < 40 && (
                            <li>• Consider adding more tables - space utilization is low</li>
                          )}
                          {calculateFloorAnalytics().utilization > 70 && (
                            <li>• Space is well utilized, ensure adequate walkway space</li>
                          )}
                          {calculateFloorAnalytics().averageTableSize < 3 && (
                            <li>• Consider larger tables for better revenue per sq ft</li>
                          )}
                          {calculateFloorAnalytics().walkwayArea < calculateFloorAnalytics().totalArea * 0.3 && (
                            <li>• Ensure at least 30% space for walkways and comfort</li>
                          )}
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Table Status Distribution</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-green-600">Available:</span>
                            <span>{tables.filter(t => t.status === 'available').length} ({((tables.filter(t => t.status === 'available').length / tables.length) * 100 || 0).toFixed(1)}%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-600">Occupied:</span>
                            <span>{tables.filter(t => t.status === 'occupied').length} ({((tables.filter(t => t.status === 'occupied').length / tables.length) * 100 || 0).toFixed(1)}%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-yellow-600">Reserved:</span>
                            <span>{tables.filter(t => t.status === 'reserved').length} ({((tables.filter(t => t.status === 'reserved').length / tables.length) * 100 || 0).toFixed(1)}%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Out of Service:</span>
                            <span>{tables.filter(t => t.status === 'out-of-service').length} ({((tables.filter(t => t.status === 'out-of-service').length / tables.length) * 100 || 0).toFixed(1)}%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="zones" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Zone Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {zones.map((zone) => (
                      <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: zone.color }}
                          />
                          <span className="font-medium">{zone.name}</span>
                          <Badge variant="secondary">{zone.tables.length} tables</Badge>
                        </div>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
