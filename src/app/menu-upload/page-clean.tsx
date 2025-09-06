'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function MenuUploadPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [menuDraft, setMenuDraft] = useState<any[]>([]);
  const [menuSaved, setMenuSaved] = useState(false);
  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [modalIngredients, setModalIngredients] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDishIndex, setCurrentDishIndex] = useState(-1);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser?.id) {
      toast({ title: 'Error', description: 'Please select a PDF file and ensure you are logged in.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      console.log('📄 Processing file:', selectedFile.name);
      const fileData = await selectedFile.arrayBuffer();
      const base64File = Buffer.from(fileData).toString('base64');

      const response = await fetch('/api/uploadMenu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64File, userId: currentUser.id }),
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.menu)) {
        setMenuDraft(data.menu);
        setMenuSaved(false);
        
        let successMsg = `Menu uploaded successfully! Found ${data.menu.length} items.`;
        let toastTitle = 'Success';
        
        if (data.isTemplate) {
          toastTitle = 'Template Created';
          successMsg = `PDF extraction had issues, created a template with ${data.menu.length} items. Please edit these manually.`;
        }
        
        toast({ title: toastTitle, description: successMsg });
      } else {
        toast({ title: 'Warning', description: data.message || 'Menu uploaded but no items found.' });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: error?.message || 'Failed to upload menu.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditCell = (rowIndex: number, field: string, value: string) => {
    const updated = [...menuDraft];
    updated[rowIndex] = { ...updated[rowIndex], [field]: value };
    setMenuDraft(updated);
    setMenuSaved(false);
  };

  const handleDeleteRow = (idx: number) => {
    setMenuDraft(menuDraft.filter((_, i) => i !== idx));
    setMenuSaved(false);
  };

  const handleDeleteIngredient = (dishIdx: number, ingredientIdx: number) => {
    const updated = [...menuDraft];
    if (updated[dishIdx].ingredients && Array.isArray(updated[dishIdx].ingredients)) {
      updated[dishIdx].ingredients.splice(ingredientIdx, 1);
      setMenuDraft(updated);
      setMenuSaved(false);
    }
  };

  const handleAddRow = () => {
    setMenuDraft([...menuDraft, { 
      id: `item-${Date.now()}`, 
      name: '', 
      price: '', 
      category: '', 
      image: '', 
      aiHint: '', 
      ingredients: [] 
    }]);
    setMenuSaved(false);
  };

  const openIngredientModal = (idx: number) => {
    setCurrentDishIndex(idx);
    setModalIngredients([]);
    setIngredientModalOpen(true);
    setIsGenerating(true);

    // Simple ingredient generation simulation
    setTimeout(() => {
      const sampleIngredients = [
        { name: 'Sample Ingredient 1', quantity: 100, unit: 'g' },
        { name: 'Sample Ingredient 2', quantity: 50, unit: 'ml' }
      ];
      setModalIngredients(sampleIngredients);
      setIsGenerating(false);
    }, 1000);
  };

  const handleSaveIngredients = () => {
    if (currentDishIndex >= 0) {
      const updated = [...menuDraft];
      updated[currentDishIndex].ingredients = modalIngredients.map(ing => ({
        inventoryItemName: ing.name,
        quantityPerDish: ing.quantity,
        unit: ing.unit
      }));
      setMenuDraft(updated);
      setMenuSaved(false);
    }
    setIngredientModalOpen(false);
  };

  const handleSaveMenu = async () => {
    if (!currentUser?.id) {
      toast({ title: 'Error', description: 'User not authenticated', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/menuCsv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu: menuDraft })
      });
      
      if (!res.ok) throw new Error('Failed to save menu');

      setMenuSaved(true);
      toast({ title: 'Success', description: 'Menu saved successfully!' });
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to save menu.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSimpleMenu = () => {
    const simpleMenu = [
      { id: "appetizer-1", name: "Appetizer Item", price: "8.50 €", category: "Appetizers", image: "", aiHint: "Please update with your actual appetizer", ingredients: [] },
      { id: "main-1", name: "Main Course Item", price: "15.90 €", category: "Main Dishes", image: "", aiHint: "Please update with your actual main course", ingredients: [] },
      { id: "dessert-1", name: "Dessert Item", price: "6.50 €", category: "Desserts", image: "", aiHint: "Please update with your actual dessert", ingredients: [] },
      { id: "beverage-1", name: "Beverage Item", price: "3.50 €", category: "Beverages", image: "", aiHint: "Please update with your actual beverage", ingredients: [] }
    ];
    
    setMenuDraft(simpleMenu);
    setMenuSaved(false);
    toast({ title: 'Template Created', description: 'Created a basic menu template. Please edit items with your actual menu content.' });
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Menu PDF</h1>
          <p className="text-gray-600">Upload your restaurant menu PDF to automatically extract items, or create a simple template.</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Choose PDF File</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-green-600">Selected: {selectedFile.name}</p>
              )}
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? 'Processing...' : 'Upload and Parse PDF'}
              </Button>
              
              <Button 
                onClick={handleCreateSimpleMenu}
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                Create Simple Menu Template
              </Button>
            </div>
          </div>
        </div>

        {/* Menu Items Display */}
        {menuDraft && menuDraft.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Menu Items</h3>
                    <p className="text-sm text-gray-600">{menuDraft.length} items in draft</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddRow} variant="outline" size="sm">+ Add Item</Button>
                  <Button onClick={handleSaveMenu} disabled={isSaving} size="sm">
                    {isSaving ? 'Saving...' : 'Save Menu'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="space-y-4">
                {menuDraft.map((dish, idx) => (
                  <div key={dish.id || idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
                        <input 
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
                          value={dish.name} 
                          onChange={e => handleEditCell(idx, 'name', e.target.value)}
                          placeholder="Enter dish name..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                        <input 
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
                          value={dish.category} 
                          onChange={e => handleEditCell(idx, 'category', e.target.value)}
                          placeholder="e.g., Main Dishes"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                        <input 
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono" 
                          value={dish.basePrice || dish.price} 
                          onChange={e => handleEditCell(idx, 'price', e.target.value)}
                          placeholder="e.g., 12.50 €"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button
                          onClick={() => openIngredientModal(idx)}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          Generate Ingredients
                        </Button>
                        <Button
                          onClick={() => handleDeleteRow(idx)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          ×
                        </Button>
                      </div>
                    </div>

                    {/* Size Options */}
                    {dish.hasSizes && dish.sizeOptions && dish.sizeOptions.length > 0 && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-blue-600 text-sm">🥤</span>
                          <span className="text-sm font-medium text-blue-800">Multiple Sizes</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dish.sizeOptions.map((size: any, sizeIdx: number) => (
                            <span key={sizeIdx} className="bg-white px-2 py-1 rounded border border-blue-300 text-xs">
                              <span className="font-medium text-blue-800">{size.size}</span>: {size.price}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Hint */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">AI Description</label>
                      <input
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        value={dish.aiHint}
                        onChange={e => handleEditCell(idx, 'aiHint', e.target.value)}
                        placeholder="Describe this dish..."
                      />
                    </div>

                    {/* Ingredients */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Ingredients</label>
                      {Array.isArray(dish.ingredients) && dish.ingredients.length > 0 ? (
                        <div className="bg-green-50 rounded-md p-3 border border-green-200">
                          <div className="flex flex-wrap gap-1">
                            {dish.ingredients.map((ing: any, i: number) => (
                              <span key={i} className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {typeof ing === 'string' ? ing : ing.inventoryItemName || ing.name || 'Unknown'}
                                {(ing.quantityPerDish || ing.quantity) && (
                                  <span className="text-green-600">({ing.quantityPerDish || ing.quantity} {ing.unit || ''})</span>
                                )}
                                <button
                                  className="text-green-600 hover:text-red-600 ml-1"
                                  onClick={() => handleDeleteIngredient(idx, i)}
                                >×</button>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-100 rounded-md p-3 border border-gray-200 text-center">
                          <span className="text-gray-500 text-sm">No ingredients yet</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  {menuSaved && (
                    <span className="text-green-600 text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Menu saved successfully
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {menuDraft.length} items ready to save
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ingredient Modal */}
        {ingredientModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
              <h2 className="text-lg font-bold mb-4">Review & Approve Ingredients</h2>
              {isGenerating ? (
                <div className="text-center py-4">Generating ingredients...</div>
              ) : (
                <div className="space-y-3">
                  {modalIngredients.map((ing, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input 
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        value={ing.name} 
                        onChange={e => {
                          const updated = [...modalIngredients];
                          updated[i].name = e.target.value;
                          setModalIngredients(updated);
                        }}
                      />
                      <input 
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                        value={ing.quantity} 
                        onChange={e => {
                          const updated = [...modalIngredients];
                          updated[i].quantity = e.target.value;
                          setModalIngredients(updated);
                        }}
                      />
                      <select 
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md"
                        value={ing.unit} 
                        onChange={e => {
                          const updated = [...modalIngredients];
                          updated[i].unit = e.target.value;
                          setModalIngredients(updated);
                        }}
                      >
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="pcs">pcs</option>
                      </select>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSaveIngredients} className="flex-1">Save Ingredients</Button>
                    <Button onClick={() => setIngredientModalOpen(false)} variant="outline">Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
