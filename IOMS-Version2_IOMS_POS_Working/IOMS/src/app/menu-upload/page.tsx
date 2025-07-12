"use client";

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getIngredientsForDish } from '@/lib/ingredientToolService';
import Link from 'next/link';

export default function MenuUploadPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [menuDraft, setMenuDraft] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [modalDishIdx, setModalDishIdx] = useState<number | null>(null);
  const [modalIngredients, setModalIngredients] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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
        toast({ title: 'Success', description: 'Menu parsed. You can now review and edit before saving.' });
      } else if (Array.isArray(data.items)) {
        setMenuDraft(data.items);
        toast({ title: 'Success', description: 'Menu parsed. You can now review and edit before saving.' });
      } else {
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
    setIsSaving(true);
    try {
      // Normalize ingredients to string[] (names only) for each dish before saving
      const menuToSave = menuDraft.map(dish => ({
        ...dish,
        ingredients: Array.isArray(dish.ingredients)
          ? dish.ingredients.map((ing: any) => typeof ing === 'string' ? ing : (ing && ing.name ? ing.name : ''))
          : (dish.ingredients || [])
      }));
      const res = await fetch('/api/menuCsv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu: menuToSave })
      });
      if (!res.ok) throw new Error('Failed to save menu');
      toast({ title: 'Success', description: 'Menu saved to backend.' });
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
  };

  const handleAddRow = () => {
    setMenuDraft([...menuDraft, { id: '', name: '', price: '', category: '', image: '', aiHint: '', ingredients: '' }]);
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
      updated[modalDishIdx].ingredients = modalIngredients;
      setMenuDraft(updated);
    }
    setIngredientModalOpen(false);
    setModalDishIdx(null);
    setModalIngredients([]);
  };

  // Batch generate ingredients for all menu items
  const handleGenerateIngredientsForAll = async () => {
    setIsBatchGenerating(true);
    try {
      const updatedMenu = await Promise.all(menuDraft.map(async (dish) => {
        if (!dish.name) return dish;
        const ingredients = await getIngredientsForDish({ name: dish.name, aiHint: dish.aiHint });
        return { ...dish, ingredients: ingredients.map((ing: any) => ({ name: ing.name || ing, quantity: ing.quantity || '', unit: ing.unit || '' })) };
      }));
      setMenuDraft(updatedMenu);
      toast({ title: 'Success', description: 'Ingredients generated for all menu items.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message || 'Failed to generate ingredients.', variant: 'destructive' });
    } finally {
      setIsBatchGenerating(false);
    }
  };

  return (
    <AppLayout pageTitle="Upload Menu PDF">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] space-y-6">
        <Input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
          {isUploading ? 'Uploading...' : 'Upload and Parse'}
        </Button>
        {menuDraft.length > 0 && (
          <div className="w-full max-w-4xl mt-8">
            <div className="flex justify-between mb-4">
              <button
                className={`bg-blue-500 text-white rounded px-3 py-1 hover:bg-blue-600 ${isBatchGenerating || isSaving || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleGenerateIngredientsForAll}
                disabled={isBatchGenerating || isSaving || isUploading}
              >
                {isBatchGenerating ? 'Generating Ingredients...' : 'Generate Ingredients for All'}
              </button>
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
                  <th className="border px-2 py-1">AI Hint</th>
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
                            <li key={i}>
                              {typeof ing === 'string' ? ing : ing.name}
                              {ing.quantity ? ` (${ing.quantity} ${ing.unit || ''})` : ''}
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
              <Button onClick={handleSaveMenu} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Menu'}</Button>
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
    </AppLayout>
  );
}
