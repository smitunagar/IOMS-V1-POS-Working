'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FloorEditorCanvas } from '@/components/table-management/FloorEditorCanvas';
import { BottomToolbar } from '@/components/table-management/BottomToolbar';
import { SaveDraftButton } from '@/components/table-management/SaveDraftButton';
import { ActivateLayoutButton } from '@/components/table-management/ActivateLayoutButton';
import { ZoneLegend } from '@/components/table-management/ZoneLegend';
import { TableMergeTool } from '@/components/table-management/TableMergeTool';
import { TableSplitTool } from '@/components/table-management/TableSplitTool';
import { QRCodeManager } from '@/components/table-management/QRCodeManager';
import { ReservationLink } from '@/components/table-management/ReservationLink';
import { useTableStore } from '@/contexts/tableStore';
import { 
  Layout, 
  Grid3X3, 
  Palette, 
  Settings, 
  History, 
  Users, 
  QrCode,
  Calendar,
  Merge,
  Split,
  Info,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers
} from 'lucide-react';

export default function TableManagementPage() {
  const { 
    tables, 
    zones, 
    selectedTableId, 
    isDraftMode, 
    isLoading, 
    error, 
    validationErrors,
    canUndo,
    canRedo,
    undo,
    redo,
    saveDraft,
    activateLayout,
    loadDraft
  } = useTableStore();

  const [activeTab, setActiveTab] = useState('editor');
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  // Load draft on mount
  useEffect(() => {
    loadDraft('main-floor');
  }, [loadDraft]);

  const hasErrors = validationErrors.length > 0;
  const selectedTable = tables.find(t => t.id === selectedTableId);
  const totalTables = tables.length;
  const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);

  return (
    <AppLayout pageTitle="Table Management">
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        
        {/* Header Section */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Layout className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-slate-900">Floor Plan Designer</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={isDraftMode ? "secondary" : "default"} className="text-xs">
                  {isDraftMode ? "Draft Mode" : "Live Layout"}
                </Badge>
                {hasErrors && (
                  <Badge variant="destructive" className="text-xs animate-pulse">
                    {validationErrors.length} Issues
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Stats */}
              <div className="hidden md:flex items-center space-x-4 text-sm text-slate-600">
                <div className="flex items-center space-x-1">
                  <Grid3X3 className="h-4 w-4" />
                  <span>{totalTables} Tables</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{totalCapacity} Seats</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Layers className="h-4 w-4" />
                  <span>{zones.length} Zones</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={!canUndo}
                  className="flex items-center space-x-1"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Undo</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={!canRedo}
                  className="flex items-center space-x-1"
                >
                  <History className="h-4 w-4 rotate-180" />
                  <span className="hidden sm:inline">Redo</span>
                </Button>
                <SaveDraftButton />
                <ActivateLayoutButton />
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {hasErrors && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Layout Issues:</strong> {validationErrors.join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Sidebar */}
          <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-4 m-2">
                <TabsTrigger value="editor" className="text-xs">
                  <Settings className="h-4 w-4 mr-1" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="zones" className="text-xs">
                  <Palette className="h-4 w-4 mr-1" />
                  Zones
                </TabsTrigger>
                <TabsTrigger value="tools" className="text-xs">
                  <Merge className="h-4 w-4 mr-1" />
                  Tools
                </TabsTrigger>
                <TabsTrigger value="export" className="text-xs">
                  <QrCode className="h-4 w-4 mr-1" />
                  Export
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="editor" className="p-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Grid3X3 className="h-4 w-4 mr-2" />
                        Add Tables
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <BottomToolbar />
                    </CardContent>
                  </Card>

                  {selectedTable && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Settings className="h-4 w-4 mr-2" />
                          Table Properties
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-slate-600">Table ID</label>
                          <div className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                            {selectedTable.label}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Capacity</label>
                          <div className="text-sm">{selectedTable.capacity} guests</div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600">Shape</label>
                          <div className="text-sm capitalize">{selectedTable.shape}</div>
                        </div>
                        {selectedTable.zone && (
                          <div>
                            <label className="text-xs font-medium text-slate-600">Zone</label>
                            <div className="text-sm">{selectedTable.zone}</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Reservations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ReservationLink />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="zones" className="p-4">
                  <ZoneLegend />
                </TabsContent>

                <TabsContent value="tools" className="p-4 space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Merge className="h-4 w-4 mr-2" />
                        Merge Tables
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TableMergeTool />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Split className="h-4 w-4 mr-2" />
                        Split Tables
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TableSplitTool />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="export" className="p-4">
                  <QRCodeManager />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 relative">
            <FloorEditorCanvas />
            
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-slate-600">Loading...</span>
                </div>
              </div>
            )}

            {/* Canvas Help */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-xs text-slate-600 max-w-xs">
              <div className="flex items-center space-x-1 mb-2">
                <Info className="h-3 w-3" />
                <span className="font-medium">Quick Help</span>
              </div>
              <div className="space-y-1">
                <div>• Click and drag to move tables</div>
                <div>• Use corner handles to resize</div>
                <div>• Arrow keys for precise positioning</div>
                <div>• Shift+Click for multi-select</div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="absolute bottom-4 right-4 flex items-center space-x-2">
              {!hasErrors ? (
                <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Layout Valid</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{validationErrors.length} Issues</span>
                </div>
              )}
              <div className="flex items-center space-x-1 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs">
                <Clock className="h-3 w-3" />
                <span>Auto-save: ON</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 