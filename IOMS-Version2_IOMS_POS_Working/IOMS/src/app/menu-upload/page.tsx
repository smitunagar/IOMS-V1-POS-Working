"use client";

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getIngredientsForDish } from '@/lib/ingredientToolService';
import { analyzeMenuInventory, autoAddRecommendedIngredients, MenuInventoryReport } from '@/lib/smartInventoryService';
import { analyzeCSV, convertCSV, generateTemplateCSV, CSVAnalysis } from '@/lib/smartCSVConverter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Plus, ShoppingCart, Eye, Play, Pause, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function MenuUploadPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [menuDraft, setMenuDraft] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [menuSaved, setMenuSaved] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [modalDishIdx, setModalDishIdx] = useState<number | null>(null);
  const [modalIngredients, setModalIngredients] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Batch processing states
  const [batchProgress, setBatchProgress] = useState({
    isProcessing: false,
    isPaused: false,
    currentIndex: 0,
    totalDishes: 0,
    progress: 0,
    processedDishes: [] as string[],
    failedDishes: [] as { name: string; error: string }[],
    batchSize: 10
  });
  
  // 🧠 NEW: Smart inventory checking states
  const [inventoryReport, setInventoryReport] = useState<MenuInventoryReport | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAddingIngredients, setAutoAddingIngredients] = useState(false);

  // 🧠 Smart CSV Upload states
  const [csvAnalysis, setCsvAnalysis] = useState<CSVAnalysis | null>(null);
  const [showCsvMappingDialog, setShowCsvMappingDialog] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');
  const [csvFieldMappings, setCsvFieldMappings] = useState<Record<string, string>>({});
  const [isCsvConverting, setIsCsvConverting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser?.id) return;
    setIsUploading(true);
    try {
      const fileData = await selectedFile.arrayBuffer();
      const base64File = Buffer.from(fileData).toString('base64');
      const response = await fetch('/api/uploadMenu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64File, userId: currentUser.id }),
      });
      if (!response.ok) {
        let errorMsg = 'Upload failed';
        try {
          const err = await response.json();
          if (err && err.error && err.error.includes('overloaded')) {
            errorMsg = 'AI service is overloaded. Please try again in a few minutes.';
          } else if (err && err.error) {
            errorMsg = err.error;
          }
        } catch {}
        toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
        setIsUploading(false);
        return;
      }
      const data = await response.json();
      if (Array.isArray(data.menu)) {
        setMenuDraft(data.menu);
        setMenuSaved(false); // Reset saved state for new upload
        toast({ title: 'Success', description: 'Menu parsed. You can now review and edit before saving.' });
      } else if (Array.isArray(data.items)) {
        setMenuDraft(data.items);
        setMenuSaved(false); // Reset saved state for new upload
        toast({ title: 'Success', description: 'Menu parsed. You can now review and edit before saving.' });
      } else {
        setMenuSaved(false); // Reset saved state for new upload
        toast({ title: 'Warning', description: 'Menu parsed, but no items found. Please check the PDF.' });
      }
    } catch (error: any) {
      let errorMsg = error?.message || 'Failed to upload menu.';
      if (errorMsg.includes('overloaded')) {
        errorMsg = 'AI service is overloaded. Please try again in a few minutes.';
      }
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveMenu = async () => {
    if (!currentUser?.id) {
      toast({ title: 'Error', description: 'User not authenticated', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      // Keep ingredients in their full format (IngredientQuantity objects) for saving
      const menuToSave = menuDraft.map(dish => ({
        ...dish,
        // Don't convert ingredients to simple strings - keep the full format
        ingredients: dish.ingredients || []
      }));

      console.log('🔍 Saving menu with ingredients:', menuToSave[0]?.ingredients); // Debug log

      // 🔥 SAVE TO BOTH BACKEND AND LOCALSTORAGE for persistence
      
      // 1. Save to backend CSV
      const res = await fetch('/api/menuCsv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu: menuToSave })
      });
      if (!res.ok) throw new Error('Failed to save menu to backend');

      // 2. Save to localStorage for immediate persistence on refresh
      const { saveDishes } = await import('@/lib/menuService');
      saveDishes(currentUser.id, menuToSave);
      console.log('✅ Menu saved to both backend and localStorage');

      // 3. Trigger menu updated event for any listening components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('menuUpdated'));
      }

      setMenuSaved(true);
      toast({ title: 'Success', description: 'Menu saved successfully! Ingredients preserved with quantities and units.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to save menu.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCell = (idx: number, field: string, value: string) => {
    const updated = [...menuDraft];
    updated[idx] = { ...updated[idx], [field]: value };
    setMenuDraft(updated);
    setMenuSaved(false); // Reset saved state when editing
  };

  const handleAddRow = () => {
    setMenuDraft([...menuDraft, { id: '', name: '', price: '', category: '', image: '', aiHint: '', ingredients: '' }]);
    setMenuSaved(false); // Reset saved state when adding rows
  };

  const handleDeleteRow = (idx: number) => {
    setMenuDraft(menuDraft.filter((_, i) => i !== idx));
  };

  // Utility: Extract quantity and price from a string (e.g., "0,3l 2,50 €")
  function extractQuantityAndPrice(str: string) {
    let quantity = '';
    let price = '';
    if (!str) return { quantity, price };
    // Try to extract quantity (e.g., 0,3l, 0.3 l, 0,3 liter, etc.)
    const quantityMatch = str.match(/([0-9]+[\.,]?[0-9]*)\s*(l|liter|ml|cl|g|kg|stück|Stück|pcs|piece|glas|Glas|flasche|Flasche)?/i);
    if (quantityMatch) {
      quantity = quantityMatch[0].replace(/\s+/g, ' ').trim();
    }
    // Try to extract price (e.g., 2,50 €, 2.50 €, 2,50 EUR, etc.)
    const priceMatch = str.match(/([0-9]+[\.,]?[0-9]*)\s*(€|eur|euro|EUR)/i);
    if (priceMatch) {
      price = priceMatch[1].replace(',', '.') + ' €';
    }
    // Fallback: if price is not found, use the original field
    if (!price) price = str;
    return { quantity, price };
  }

  // When menuDraft is set from upload, parse quantity and price
  React.useEffect(() => {
    if (menuDraft.length > 0 && !menuDraft[0].quantity) {
      setMenuDraft(menuDraft.map(dish => {
        const { quantity, price } = extractQuantityAndPrice(dish.price || '');
        return { ...dish, quantity, price };
      }));
    }
    // eslint-disable-next-line
  }, [menuDraft.length]);

  // Open modal for a dish
  const openIngredientModal = async (idx: number) => {
    setModalDishIdx(idx);
    setIngredientModalOpen(true);
    setIsGenerating(true);
    const dish = menuDraft[idx];
    try {
      const ingredients = await getIngredientsForDish({ name: dish.name, aiHint: dish.aiHint });
      setModalIngredients(ingredients.map((ing: any) => ({ name: ing.name || ing, quantity: ing.quantity || '', unit: ing.unit || '' })));
    } catch {
      setModalIngredients([]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Approve modal ingredients
  const approveModalIngredients = () => {
    if (modalDishIdx !== null) {
      const updated = [...menuDraft];
      // 🔥 ENHANCED: Convert ingredients to proper format for inventory deduction
      const properFormatIngredients = modalIngredients.map(ing => ({
        inventoryItemName: ing.name || ing,           // Use 'inventoryItemName' for consistency
        quantityPerDish: ing.quantity || 100,        // Default to 100 if no quantity specified
        unit: ing.unit || 'g'                        // Default to 'g' if no unit specified
      }));
      
      console.log('🔄 Converting ingredients to proper format:', properFormatIngredients);
      updated[modalDishIdx].ingredients = properFormatIngredients;
      setMenuDraft(updated);
      setMenuSaved(false); // Reset saved state when ingredients are updated
    }
    setIngredientModalOpen(false);
    setModalDishIdx(null);
    setModalIngredients([]);
  };

  // Enhanced batch generate ingredients for all menu items with progress tracking
  const handleGenerateIngredientsForAll = async () => {
    if (menuDraft.length === 0) {
      toast({ title: 'Error', description: 'No menu items to process', variant: 'destructive' });
      return;
    }

    // Initialize batch processing
    setBatchProgress({
      isProcessing: true,
      isPaused: false,
      currentIndex: 0,
      totalDishes: menuDraft.length,
      progress: 0,
      processedDishes: [],
      failedDishes: [],
      batchSize: 10
    });
    
    setIsBatchGenerating(true);
    
    toast({
      title: "Batch Processing Started",
      description: `Processing ${menuDraft.length} dishes with intelligent batch processing`,
    });

    try {
      const updatedMenu = [...menuDraft];
      const dishesToProcess = menuDraft.filter(dish => dish.name);
      
      // Process dishes in batches
      for (let i = 0; i < dishesToProcess.length; i++) {
        // Check if paused
        if (batchProgress.isPaused) {
          break;
        }

        const dish = dishesToProcess[i];
        
        // Update progress
        setBatchProgress(prev => ({
          ...prev,
          currentIndex: i + 1,
          progress: ((i + 1) / dishesToProcess.length) * 100
        }));

        try {
          console.log(`🔄 Processing dish ${i + 1}/${dishesToProcess.length}: ${dish.name}`);
          
          const ingredients = await getIngredientsForDish({ 
            name: dish.name, 
            aiHint: dish.aiHint 
          });
          
          // Convert AI ingredients to proper format for inventory deduction
          const properFormatIngredients = ingredients.map((ing: any) => ({
            inventoryItemName: ing.name || ing,
            quantityPerDish: ing.quantity || 100,
            unit: ing.unit || 'g'
          }));
          
          // Find and update the dish in the menu
          const menuIndex = updatedMenu.findIndex(menuDish => menuDish.name === dish.name);
          if (menuIndex !== -1) {
            updatedMenu[menuIndex] = { 
              ...updatedMenu[menuIndex], 
              ingredients: properFormatIngredients 
            };
          }
          
          // Add to processed dishes
          setBatchProgress(prev => ({
            ...prev,
            processedDishes: [...prev.processedDishes, dish.name]
          }));
          
          console.log(`✅ Successfully processed: ${dish.name}`);
          
          // Add delay between requests to avoid overwhelming the AI service
          if (i < dishesToProcess.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`❌ Failed to process dish ${dish.name}:`, error);
          
          setBatchProgress(prev => ({
            ...prev,
            failedDishes: [...prev.failedDishes, { 
              name: dish.name, 
              error: error instanceof Error ? error.message : "Unknown error" 
            }]
          }));
        }

        // Add pause between batches (every 10 dishes)
        if ((i + 1) % batchProgress.batchSize === 0 && i < dishesToProcess.length - 1) {
          console.log(`⏸️ Pausing for 2 seconds after batch ${Math.ceil((i + 1) / batchProgress.batchSize)}`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Update the menu with all processed dishes
      setMenuDraft(updatedMenu);
      setMenuSaved(false);
      
      // Complete processing
      setBatchProgress(prev => ({
        ...prev,
        isProcessing: false,
        progress: 100
      }));
      
      const successCount = batchProgress.processedDishes.length;
      const failureCount = batchProgress.failedDishes.length;
      
      toast({ 
        title: 'Batch Processing Complete!', 
        description: `Successfully processed ${successCount} dishes. ${failureCount} failed.` 
      });
      
    } catch (error: any) {
      console.error('❌ Batch processing error:', error);
      toast({ 
        title: 'Error', 
        description: error?.message || 'Failed to generate ingredients.', 
        variant: 'destructive' 
      });
      
      setBatchProgress(prev => ({
        ...prev,
        isProcessing: false
      }));
    } finally {
      setIsBatchGenerating(false);
    }
  };

  // Pause/Resume batch processing
  const toggleBatchProcessing = () => {
    setBatchProgress(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
    
    toast({
      title: batchProgress.isPaused ? "Processing Resumed" : "Processing Paused",
      description: batchProgress.isPaused ? "Batch processing will continue" : "Batch processing is paused",
    });
  };

  // Reset batch processing
  const resetBatchProcessing = () => {
    setBatchProgress({
      isProcessing: false,
      isPaused: false,
      currentIndex: 0,
      totalDishes: 0,
      progress: 0,
      processedDishes: [],
      failedDishes: [],
      batchSize: 10
    });
    
    setIsBatchGenerating(false);
    
    toast({
      title: "Batch Processing Reset",
      description: "Ready to start a new batch processing session",
    });
  };

  // 🧠 NEW: Smart inventory analysis
  const handleAnalyzeInventory = async () => {
    if (!currentUser?.id || menuDraft.length === 0) {
      toast({ title: 'Error', description: 'Please upload a menu first and ensure you are logged in.', variant: 'destructive' });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Filter dishes that have ingredients
      const dishesWithIngredients = menuDraft.filter(dish => dish.ingredients && dish.ingredients.length > 0);
      
      if (dishesWithIngredients.length === 0) {
        toast({ title: 'Info', description: 'Please generate ingredients for your dishes first using "Generate All Ingredients".', variant: 'default' });
        setIsAnalyzing(false);
        return;
      }

      console.log('🧠 Analyzing inventory for dishes:', dishesWithIngredients.map(d => d.name));
      console.log('🧠 Raw ingredients format:', dishesWithIngredients[0].ingredients);
      
      // Convert ingredients to the correct format - handle both string arrays and object arrays
      const formattedMenu = dishesWithIngredients.map(dish => {
        let formattedIngredients = [];
        
        if (Array.isArray(dish.ingredients)) {
          formattedIngredients = dish.ingredients.map((ing: any) => {
            // If ingredient is already in correct format
            if (typeof ing === 'object' && ing.inventoryItemName) {
              return ing;
            }
            // If ingredient is in {name, quantity, unit} format
            else if (typeof ing === 'object' && ing.name) {
              return {
                inventoryItemName: ing.name,
                quantityPerDish: parseFloat(ing.quantity) || 100, // Default quantity if missing
                unit: ing.unit || 'g' // Default unit if missing
              };
            }
            // If ingredient is just a string
            else if (typeof ing === 'string') {
              return {
                inventoryItemName: ing,
                quantityPerDish: 100, // Default quantity for string ingredients
                unit: 'g' // Default unit
              };
            }
            // Fallback
            else {
              return {
                inventoryItemName: String(ing),
                quantityPerDish: 100,
                unit: 'g'
              };
            }
          });
        }
        
        console.log(`📋 Formatted ingredients for ${dish.name}:`, formattedIngredients);
        
        return {
          ...dish,
          ingredients: formattedIngredients
        };
      });

      console.log('� Calling analyzeMenuInventory with formatted menu...');
      const report = analyzeMenuInventory(currentUser.id, formattedMenu);
      console.log('📊 Analysis report:', report);
      
      setInventoryReport(report);
      setShowInventoryModal(true);
      
      toast({ 
        title: 'Analysis Complete', 
        description: `Found ${report.dishesWithAllIngredients}/${report.totalDishes} dishes with all ingredients available.` 
      });
    } catch (error) {
      console.error('❌ Inventory analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({ title: 'Error', description: `Failed to analyze inventory: ${errorMessage}. Check console for details.`, variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 🚀 NEW: Auto-add missing ingredients
  const handleAutoAddIngredients = async () => {
    if (!inventoryReport || !currentUser?.id) return;

    setAutoAddingIngredients(true);
    try {
      const result = autoAddRecommendedIngredients(currentUser.id, inventoryReport.recommendations);
      
      toast({ 
        title: 'Ingredients Added', 
        description: `Successfully added ${result.added} ingredients. ${result.failed} failed.`,
        variant: result.failed > 0 ? 'default' : 'default'
      });

      // Re-analyze after adding
      if (result.added > 0) {
        setTimeout(() => {
          handleAnalyzeInventory();
        }, 1000);
      }

      console.log('✅ Auto-add result:', result);
    } catch (error) {
      console.error('❌ Auto-add failed:', error);
      toast({ title: 'Error', description: 'Failed to add ingredients. Please try again.', variant: 'destructive' });
    } finally {
      setAutoAddingIngredients(false);
    }
  };

  // 🧠 SMART CSV MENU UPLOAD FUNCTIONS
  const handleCsvFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) {
      toast({ title: "Error", description: "Please log in to import menu.", variant: "destructive" });
      return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        toast({ title: "Error", description: "Could not read file content.", variant: "destructive"});
        return;
      }
      
      // 🧠 SMART CSV ANALYSIS FOR MENU
      try {
        console.log('🧠 Starting smart CSV analysis for menu...');
        const analysis = analyzeCSV(text, 'menu');
        
        if (analysis.confidence < 0.3) {
          toast({ 
            title: "🤔 CSV Format Not Recognized", 
            description: "I'll help you map the fields manually. Please check the mapping dialog.", 
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "🧠 Smart Menu CSV Analysis Complete", 
            description: `Detected format with ${(analysis.confidence * 100).toFixed(0)}% confidence. Review mappings before import.`,
            duration: 5000
          });
        }
        
        // Store analysis results and show mapping dialog
        setCsvAnalysis(analysis);
        setCsvContent(text);
        
        // Pre-populate mappings from analysis
        const initialMappings: Record<string, string> = {};
        analysis.suggestedMappings.forEach(mapping => {
          initialMappings[mapping.originalName] = mapping.suggestedMapping;
        });
        setCsvFieldMappings(initialMappings);
        
        setShowCsvMappingDialog(true);
        
      } catch (error: any) {
        console.error('❌ CSV analysis failed:', error);
        toast({ 
          title: "❌ CSV Analysis Failed", 
          description: error.message || "Could not analyze CSV format. Please check file format.",
          variant: "destructive" 
        });
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleConfirmCsvMapping = async () => {
    if (!csvAnalysis || !csvContent || !currentUser) return;
    
    setIsCsvConverting(true);
    try {
      console.log('🔄 Converting menu CSV with mappings:', csvFieldMappings);
      
      const conversionResult = convertCSV(csvContent, csvFieldMappings, 'menu');
      
      if (!conversionResult.success) {
        throw new Error('Conversion failed');
      }
      
      // Convert to menu draft format - preserve proper ingredient format
      const menuDraftItems = conversionResult.convertedData.map(item => {
        let ingredients = [];
        
        // Handle ingredients properly based on format
        if (item.ingredients) {
          if (typeof item.ingredients === 'string') {
            // If it's a string, parse it based on format
            try {
              // Try to parse as JSON first (from CSV with objects)
              if (item.ingredients.startsWith('[') && item.ingredients.endsWith(']')) {
                ingredients = JSON.parse(item.ingredients);
              } else {
                // Otherwise split by comma and create basic ingredient objects
                ingredients = item.ingredients.split(',').map((ing: string) => ({
                  inventoryItemName: ing.trim(),
                  quantityPerDish: 100, // Default quantity
                  unit: 'g' // Default unit
                }));
              }
            } catch (e) {
              // Fallback: treat as comma-separated string
              ingredients = item.ingredients.split(',').map((ing: string) => ({
                inventoryItemName: ing.trim(),
                quantityPerDish: 100,
                unit: 'g'
              }));
            }
          } else if (Array.isArray(item.ingredients)) {
            // If it's already an array, ensure proper format
            ingredients = item.ingredients.map((ing: any) => {
              if (typeof ing === 'object' && ing.inventoryItemName) {
                return ing; // Already in correct format
              } else if (typeof ing === 'string') {
                return {
                  inventoryItemName: ing,
                  quantityPerDish: 100,
                  unit: 'g'
                };
              } else {
                return {
                  inventoryItemName: String(ing),
                  quantityPerDish: 100,
                  unit: 'g'
                };
              }
            });
          }
        }
        
        return {
          id: item.id || `menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: item.name || 'Unnamed Item',
          quantity: parseFloat(item.quantity) || 1,
          price: parseFloat(item.price) || 0,
          category: item.category || 'General',
          image: item.image || '',
          aiHint: item.aiHint || '',
          ingredients: ingredients
        };
      });
      
      // Set menu draft
      setMenuDraft(menuDraftItems);
      setMenuSaved(false);
      
      // Show results with intelligence summary
      const totalIntelligence = Object.values(conversionResult.intelligenceApplied).reduce((a, b) => a + b, 0);
      toast({ 
        title: "🎉 Smart Menu Import Successful!", 
        description: `Imported ${menuDraftItems.length} menu items with ${totalIntelligence} smart enhancements! ${conversionResult.warnings.length} insights provided.`,
        duration: 8000
      });
      
      if (conversionResult.warnings.length > 0) {
        console.log('⚠️ Import warnings:', conversionResult.warnings);
        toast({
          title: "⚠️ Import Warnings",
          description: `${conversionResult.warnings.length} warnings detected. Check console for details.`,
          variant: "default"
        });
      }
      
      // Close dialogs
      setShowCsvMappingDialog(false);
      setCsvAnalysis(null);
      setCsvContent('');
      setCsvFieldMappings({});
      
    } catch (error: any) {
      console.error('❌ Smart menu import failed:', error);
      toast({
        title: "❌ Import Failed",
        description: error.message || "Failed to import menu CSV. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCsvConverting(false);
    }
  };
  
  const handleCsvMappingChange = (originalField: string, targetField: string) => {
    setCsvFieldMappings(prev => ({
      ...prev,
      [originalField]: targetField
    }));
  };
  
  const downloadMenuTemplate = () => {
    const templateContent = generateTemplateCSV('menu');
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'menu_smart_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast({title: "📥 Menu Template Downloaded", description: "Use this template for guaranteed compatibility!"});
  };

  return (
    <AppLayout pageTitle="Upload Menu">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] space-y-6">
        
        {/* 📄 PDF Upload Section */}
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center">📄 Upload Menu PDF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isUploading}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : 'Upload and Parse PDF'}
            </Button>
          </CardContent>
        </Card>

        {/* ✨ OR Separator */}
        <div className="flex items-center space-x-4 w-full max-w-2xl">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-gray-500 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* 📊 Smart CSV Upload Section */}
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-center">📊 Smart CSV Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 text-center">
              Upload any CSV file with menu data - our smart converter will automatically detect and map your fields!
            </div>
            <Input
              type="file"
              accept=".csv"
              onChange={handleCsvFileUpload}
              disabled={isUploading || isCsvConverting}
            />
            <Button 
              onClick={downloadMenuTemplate}
              variant="outline"
              className="w-full"
            >
              📥 Download Smart Template
            </Button>
          </CardContent>
        </Card>
        {menuDraft.length > 0 && (
          <div className="w-full max-w-4xl mt-8">
            {/* Enhanced Batch Processing Controls */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex flex-col space-y-4">
                {/* Main Control Buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-3">
                    <button
                      className={`bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors flex items-center space-x-2 ${
                        isBatchGenerating || isSaving || isUploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={handleGenerateIngredientsForAll}
                      disabled={isBatchGenerating || isSaving || isUploading}
                    >
                      {isBatchGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Generating Ingredients...</span>
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          <span>Generate Ingredients for All</span>
                        </>
                      )}
                    </button>
                    
                    {batchProgress.isProcessing && (
                      <button
                        className="bg-orange-500 text-white rounded-lg px-4 py-2 hover:bg-orange-600 transition-colors flex items-center space-x-2"
                        onClick={toggleBatchProcessing}
                      >
                        {batchProgress.isPaused ? (
                          <>
                            <Play size={16} />
                            <span>Resume</span>
                          </>
                        ) : (
                          <>
                            <Pause size={16} />
                            <span>Pause</span>
                          </>
                        )}
                      </button>
                    )}
                    
                    {(batchProgress.isProcessing || batchProgress.processedDishes.length > 0) && (
                      <button
                        className="bg-gray-500 text-white rounded-lg px-4 py-2 hover:bg-gray-600 transition-colors flex items-center space-x-2"
                        onClick={resetBatchProcessing}
                        disabled={batchProgress.isProcessing && !batchProgress.isPaused}
                      >
                        <RotateCcw size={16} />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                  
                  <button
                    className={`bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600 flex items-center space-x-2 ${
                      isAnalyzing || autoAddingIngredients ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={handleAnalyzeInventory}
                    disabled={isAnalyzing || autoAddingIngredients}
                  >
                    <ShoppingCart size={16} />
                    <span>{isAnalyzing ? 'Analyzing Inventory...' : 'Check Inventory'}</span>
                  </button>
                </div>

                {/* Batch Processing Progress */}
                {(batchProgress.isProcessing || batchProgress.processedDishes.length > 0) && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">
                        {batchProgress.isProcessing 
                          ? (batchProgress.isPaused ? "⏸️ Processing Paused" : "🔄 Processing...") 
                          : "✅ Processing Complete"
                        }
                      </span>
                      <span className="text-gray-600">
                        {batchProgress.currentIndex} of {batchProgress.totalDishes} dishes
                      </span>
                    </div>
                    
                    <Progress value={batchProgress.progress} className="h-3" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="bg-white p-3 rounded-lg border">
                        <div className="font-medium mb-1">Progress</div>
                        <div className="text-gray-600">
                          {Math.round(batchProgress.progress)}% Complete
                        </div>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="font-medium mb-1 flex items-center gap-1">
                          <CheckCircle size={14} className="text-green-600" />
                          <span className="text-green-900">Successful</span>
                        </div>
                        <div className="text-green-700">
                          {batchProgress.processedDishes.length} dishes
                        </div>
                      </div>
                      
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="font-medium mb-1 flex items-center gap-1">
                          <AlertTriangle size={14} className="text-red-600" />
                          <span className="text-red-900">Failed</span>
                        </div>
                        <div className="text-red-700">
                          {batchProgress.failedDishes.length} dishes
                        </div>
                      </div>
                    </div>

                    {/* Recent Processing Status */}
                    {batchProgress.processedDishes.length > 0 && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <div className="font-medium text-green-900 mb-2">Recent Successes:</div>
                        <div className="flex flex-wrap gap-1">
                          {batchProgress.processedDishes.slice(-5).map((dishName, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                              {dishName}
                            </Badge>
                          ))}
                          {batchProgress.processedDishes.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{batchProgress.processedDishes.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Failed Dishes */}
                    {batchProgress.failedDishes.length > 0 && (
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="font-medium text-red-900 mb-2">Failed Dishes:</div>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                          {batchProgress.failedDishes.map((failure, index) => (
                            <div key={index} className="text-xs text-red-700">
                              <span className="font-medium">{failure.name}:</span> {failure.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <table className="min-w-full border text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1">ID</th>
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">Category</th>
                  <th className="border px-2 py-1">Quantity</th>
                  <th className="border px-2 py-1">Price</th>
                  <th className="border px-2 py-1">Image</th>
                  <th className="border px-2 py-1">Smart Suggestions</th>
                  <th className="border px-2 py-1">Ingredients</th>
                  <th className="border px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {menuDraft.map((dish, idx) => (
                  <tr key={dish.id || idx}>
                    <td className="border px-2 py-1">
                      <input className="w-full border rounded px-1" value={dish.id || ''} onChange={e => handleEditCell(idx, 'id', e.target.value)} />
                    </td>
                    <td className="border px-2 py-1">
                      <input className="w-full border rounded px-1" value={dish.name} onChange={e => handleEditCell(idx, 'name', e.target.value)} />
                    </td>
                    <td className="border px-2 py-1">
                      <input className="w-full border rounded px-1" value={dish.category} onChange={e => handleEditCell(idx, 'category', e.target.value)} />
                    </td>
                    <td className="border px-2 py-1">
                      <input className="w-full border rounded px-1" value={dish.quantity || ''} onChange={e => handleEditCell(idx, 'quantity', e.target.value)} />
                    </td>
                    <td className="border px-2 py-1">
                      <input className="w-full border rounded px-1" value={dish.price} onChange={e => handleEditCell(idx, 'price', e.target.value)} />
                    </td>
                    <td className="border px-2 py-1">
                      <input className="w-full border rounded px-1" value={dish.image} onChange={e => handleEditCell(idx, 'image', e.target.value)} />
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <input className="w-full border rounded px-1 mb-2" value={dish.aiHint} onChange={e => handleEditCell(idx, 'aiHint', e.target.value)} />
                      <button
                        className="bg-blue-500 text-white rounded px-2 py-1 hover:bg-blue-600 transition-colors duration-150 shadow-sm"
                        style={{ minWidth: 120 }}
                        onClick={() => openIngredientModal(idx)}
                      >
                        Generate Ingredients
                      </button>
                    </td>
                    <td className="border px-2 py-1">
                      {Array.isArray(dish.ingredients) && dish.ingredients.length > 0 ? (
                        <ul className="list-disc pl-4">
                          {dish.ingredients.map((ing: any, i: number) => (
                            <li key={i} className="text-sm">
                              {/* Handle different ingredient formats */}
                              {typeof ing === 'string' ? ing : 
                               ing.inventoryItemName ? ing.inventoryItemName : 
                               ing.name ? ing.name : 'Unknown'}
                              {/* Show quantity if available */}
                              {(ing.quantityPerDish || ing.quantity) ? 
                                ` (${ing.quantityPerDish || ing.quantity} ${ing.unit || ''})` : ''}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-lg">&bull;</span>
                      )}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button className="bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600" onClick={() => handleDeleteRow(idx)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between mt-4">
              <button className="bg-green-500 text-white rounded px-3 py-1 hover:bg-green-600" onClick={handleAddRow}>Add Row</button>
              <div className="flex items-center gap-2">
                {menuSaved && (
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Saved & Persisted
                  </span>
                )}
                <Button onClick={handleSaveMenu} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Menu'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ingredient Modal */}
      {ingredientModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl border border-blue-200">
            <h2 className="text-lg font-bold mb-4 text-blue-700">Review & Approve Ingredients</h2>
            {isGenerating ? (
              <div className="text-center text-blue-600">Generating ingredients...</div>
            ) : (
              <div>
                {modalIngredients.length === 0 && (
                  <div className="text-gray-500 mb-2">No ingredients were generated.</div>
                )}
                {modalIngredients.map((ing, i) => {
                  // Check if this ingredient already exists in the menuDraft[modalDishIdx]?.ingredients
                  const alreadyExists = modalDishIdx !== null && Array.isArray(menuDraft[modalDishIdx].ingredients)
                    ? menuDraft[modalDishIdx].ingredients.some((existing: any) => existing.name?.toLowerCase() === ing.name?.toLowerCase())
                    : false;
                  return (
                    <div key={i} className="flex space-x-2 mb-2 items-center">
                      <input className={`border rounded px-1 w-1/2 ${alreadyExists ? 'bg-yellow-100 border-yellow-400' : ''}`} value={ing.name} onChange={e => {
                        const updated = [...modalIngredients];
                        updated[i].name = e.target.value;
                        setModalIngredients(updated);
                      }} placeholder="Name" />
                      <input className="border rounded px-1 w-1/4" value={ing.quantity} onChange={e => {
                        const updated = [...modalIngredients];
                        updated[i].quantity = e.target.value;
                        setModalIngredients(updated);
                      }} placeholder="Quantity" />
                      <input className="border rounded px-1 w-1/4" value={ing.unit} onChange={e => {
                        const updated = [...modalIngredients];
                        updated[i].unit = e.target.value;
                        setModalIngredients(updated);
                      }} placeholder="Unit" />
                      {alreadyExists && <span className="text-xs text-yellow-600 ml-1">Already in menu</span>}
                    </div>
                  );
                })}
                <button className="bg-green-500 text-white rounded px-3 py-1 mt-4 hover:bg-green-600 shadow" onClick={approveModalIngredients}>Approve & Fill</button>
                <button className="ml-2 bg-gray-300 rounded px-3 py-1 mt-4 hover:bg-gray-400" onClick={() => setIngredientModalOpen(false)}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🧠 Enhanced Inventory Analysis Modal */}
      {showInventoryModal && inventoryReport && (
        <Dialog open={showInventoryModal} onOpenChange={setShowInventoryModal}>
          <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <ShoppingCart size={20} />
                <span>Smart Inventory Analysis</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Dishes</p>
                        <p className="text-2xl font-bold">{inventoryReport.totalDishes}</p>
                      </div>
                      <Eye className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ready to Cook</p>
                        <p className="text-2xl font-bold text-green-600">{inventoryReport.dishesWithAllIngredients}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Missing Ingredients</p>
                        <p className="text-2xl font-bold text-red-600">{inventoryReport.dishesWithMissingIngredients}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Missing Ingredients Summary */}
              {inventoryReport.uniqueMissingIngredients.size > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Missing Ingredients ({inventoryReport.uniqueMissingIngredients.size})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(inventoryReport.uniqueMissingIngredients).map(ingredient => (
                        <Badge key={ingredient} variant="destructive">{ingredient}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detailed Dish Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {inventoryReport.detailedAnalysis.map((analysis, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{analysis.dishName}</h4>
                          <div className="flex space-x-2">
                            <Badge variant={analysis.missingIngredients === 0 ? "default" : "destructive"}>
                              {analysis.foundIngredients}/{analysis.totalIngredients} ingredients
                            </Badge>
                            {analysis.canMakeServings > 0 && (
                              <Badge variant="secondary">{analysis.canMakeServings} servings possible</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong className="text-green-600">✅ Available:</strong>
                            <ul className="list-disc pl-4 text-xs">
                              {analysis.results.filter(r => r.status === 'found').map((result, i) => (
                                <li key={i}>{result.ingredientName}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <strong className="text-red-600">❌ Missing:</strong>
                            <ul className="list-disc pl-4 text-xs">
                              {analysis.results.filter(r => r.status === 'missing').map((result, i) => (
                                <li key={i}>{result.ingredientName}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <DialogFooter className="space-x-2">
              <Button variant="outline" onClick={() => setShowInventoryModal(false)}>
                Close
              </Button>
              
              <Button variant="outline" onClick={() => window.open('/inventory', '_blank')}>
                <Eye size={16} className="mr-2" />
                View Inventory
              </Button>
              
              {inventoryReport.recommendations.length > 0 && (
                <Button
                  onClick={handleAutoAddIngredients}
                  disabled={autoAddingIngredients}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus size={16} className="mr-2" />
                  {autoAddingIngredients ? 'Adding...' : `Auto-Add ${inventoryReport.recommendations.length} Ingredients`}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 🧠 CSV Mapping Dialog */}
      {showCsvMappingDialog && (
        <Dialog open={showCsvMappingDialog} onOpenChange={setShowCsvMappingDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>CSV Field Mapping</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Please review and confirm the field mappings detected in your CSV file. Adjust any fields if necessary.
              </p>
              
              {/* Mappings Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">Original Field</th>
                      <th className="border px-2 py-1">Suggested Mapping</th>
                      <th className="border px-2 py-1">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvAnalysis?.suggestedMappings.map((mapping, idx) => (
                      <tr key={idx}>
                        <td className="border px-2 py-1">{mapping.originalName}</td>
                        <td className="border px-2 py-1">
                          <input
                            type="text"
                            value={mapping.suggestedMapping}
                            onChange={e => handleCsvMappingChange(mapping.originalName, e.target.value)}
                            className="w-full border rounded px-1"
                          />
                        </td>
                        <td className="border px-2 py-1 text-center">
                          <button
                            onClick={() => {
                              const updatedMappings = csvAnalysis?.suggestedMappings.filter((_, i) => i !== idx);
                              setCsvAnalysis(prev => prev ? { ...prev, suggestedMappings: updatedMappings } : null);
                            }}
                            className="text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <DialogFooter className="space-x-2">
              <Button variant="outline" onClick={() => setShowCsvMappingDialog(false)}>
                Cancel
              </Button>
              
              <Button onClick={handleConfirmCsvMapping} disabled={isCsvConverting}>
                {isCsvConverting ? 'Converting...' : 'Confirm and Import'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppLayout>
  );
}
