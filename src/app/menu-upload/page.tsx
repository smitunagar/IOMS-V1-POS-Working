'use client';

import React, { useState } from 'react';
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
      toast({ 
        title: 'Error', 
        description: 'Please select a PDF file and ensure you are logged in.', 
        variant: 'destructive' 
      });
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
        toast({ 
          title: 'Success!', 
          description: `Extracted ${data.menu.length} menu items from your PDF`
        });
      } else {
        throw new Error(data.error || 'Failed to process menu');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({ 
        title: 'Upload Failed', 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditCell = (index: number, field: string, value: any) => {
    const updatedMenu = [...menuDraft];
    updatedMenu[index] = { ...updatedMenu[index], [field]: value };
    setMenuDraft(updatedMenu);
  };

  const handleDeleteRow = (index: number) => {
    const updatedMenu = menuDraft.filter((_, i) => i !== index);
    setMenuDraft(updatedMenu);
  };

  const handleAddRow = () => {
    const newRow = {
      id: `custom-${Date.now()}`,
      name: '',
      category: '',
      price: '',
      image: '',
      ingredients: [],
    };
    setMenuDraft([...menuDraft, newRow]);
  };

  const openIngredientModal = (dishIndex: number) => {
    setCurrentDishIndex(dishIndex);
    setModalIngredients(menuDraft[dishIndex]?.ingredients || []);
    setIngredientModalOpen(true);
  };

  const handleGenerateIngredients = async (dishIndex: number) => {
    const dish = menuDraft[dishIndex];
    if (!dish?.name) {
      toast({ 
        title: 'Error', 
        description: 'Dish name is required to generate ingredients', 
        variant: 'destructive' 
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishName: dish.name, category: dish.category || '' }),
      });

      const data = await response.json();
      if (data.success && data.ingredients) {
        handleEditCell(dishIndex, 'ingredients', data.ingredients);
        toast({ 
          title: 'Success!', 
          description: `Generated ${data.ingredients.length} ingredients for ${dish.name}` 
        });
      } else {
        throw new Error(data.error || 'Failed to generate ingredients');
      }
    } catch (error) {
      console.error('Ingredient generation error:', error);
      toast({ 
        title: 'Generation Failed', 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteIngredient = (dishIndex: number, ingredientIndex: number) => {
    const updatedMenu = [...menuDraft];
    if (updatedMenu[dishIndex]?.ingredients) {
      updatedMenu[dishIndex].ingredients = updatedMenu[dishIndex].ingredients.filter(
        (_: any, i: number) => i !== ingredientIndex
      );
      setMenuDraft(updatedMenu);
    }
  };

  const saveMenu = async () => {
    if (!currentUser?.id || menuDraft.length === 0) {
      toast({ 
        title: 'Error', 
        description: 'No menu data to save or user not logged in', 
        variant: 'destructive' 
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/saveMenu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu: menuDraft, userId: currentUser.id }),
      });

      const data = await response.json();
      if (data.success) {
        setMenuSaved(true);
        toast({ title: 'Success!', description: 'Menu saved successfully to database' });
      } else {
        throw new Error(data.error || 'Failed to save menu');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({ 
        title: 'Save Failed', 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Upload & Management</h1>
          <p className="text-gray-600">Upload your restaurant menu PDF and manage your dishes with AI assistance</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Menu PDF</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="menu-file" className="block text-sm font-medium text-gray-700 mb-2">
                Select PDF File
              </label>
              <input
                id="menu-file"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <span className="text-sm text-gray-700">📄 {selectedFile.name}</span>
                <span className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? 'Processing...' : 'Upload & Extract Menu'}
            </Button>
          </div>
        </div>

        {/* Menu Preview Section */}
        {menuDraft.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Extracted Menu Items ({menuDraft.length})
              </h2>
              
              <div className="flex gap-3">
                <Button onClick={handleAddRow} variant="outline" size="sm">
                  + Add Item
                </Button>
                <Button
                  onClick={saveMenu}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? 'Saving...' : 'Save Menu'}
                </Button>
              </div>
            </div>

            {menuSaved && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Menu successfully saved to database!</span>
              </div>
            )}

            {/* Menu Items Grid */}
            <div className="space-y-4">
              {menuDraft.map((dish, index) => (
                <div key={dish.id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Dish Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Dish Name</label>
                      <input
                        type="text"
                        value={dish.name || ''}
                        onChange={(e) => handleEditCell(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Enter dish name"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                      <input
                        type="text"
                        value={dish.category || ''}
                        onChange={(e) => handleEditCell(index, 'category', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="e.g., Appetizer, Main Course"
                      />
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                      <input
                        type="text"
                        value={dish.price || ''}
                        onChange={(e) => handleEditCell(index, 'price', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="e.g., $12.99"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-end gap-2">
                      <Button
                        onClick={() => handleGenerateIngredients(index)}
                        disabled={isGenerating}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        {isGenerating ? 'Generating...' : 'AI Ingredients'}
                      </Button>
                      <Button
                        onClick={() => handleDeleteRow(index)}
                        size="sm"
                        variant="destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Ingredients Display */}
                  {dish.ingredients && Array.isArray(dish.ingredients) && dish.ingredients.length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Ingredients ({dish.ingredients.length})
                        </span>
                        <Button
                          onClick={() => openIngredientModal(index)}
                          size="sm"
                          variant="ghost"
                        >
                          Manage
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dish.ingredients.slice(0, 5).map((ingredient: any, i: number) => (
                          <span
                            key={i}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {typeof ingredient === 'string' ? ingredient : ingredient.name}
                          </span>
                        ))}
                        {dish.ingredients.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{dish.ingredients.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {menuDraft.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="max-w-md mx-auto">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Menu Uploaded Yet</h3>
              <p className="text-gray-600 mb-4">
                Upload a PDF menu file to get started. Our AI will extract and organize your menu items automatically.
              </p>
            </div>
          </div>
        )}

        {/* Ingredient Management Modal */}
        {ingredientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                Manage Ingredients - {menuDraft[currentDishIndex]?.name}
              </h3>
              
              <div className="space-y-2 mb-4">
                {modalIngredients.map((ingredient, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">
                      {typeof ingredient === 'string' ? ingredient : ingredient.name}
                    </span>
                    <Button
                      onClick={() => handleDeleteIngredient(currentDishIndex, i)}
                      size="sm"
                      variant="destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setIngredientModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleGenerateIngredients(currentDishIndex)}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  {isGenerating ? 'Generating...' : 'Regenerate Ingredients'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
