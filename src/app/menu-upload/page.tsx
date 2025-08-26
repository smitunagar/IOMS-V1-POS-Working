"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, ChevronDown, ChevronUp, Plus, Trash2, RefreshCw, Boxes } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from '@/contexts/AuthContext';
import { addOrUpdateIngredientInInventory } from '@/lib/inventoryService';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function MenuUploadPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIngredients, setModalIngredients] = useState<any[]>([]);
  const [modalDish, setModalDish] = useState<string>('');

  // Helper to get default expiry date based on ingredient name
  function getDefaultExpiry(ingredientName: string): string {
    const now = new Date();
    const lower = ingredientName.toLowerCase();
    if (/(milk|cheese|cream|paneer|yogurt|curd|meat|chicken|fish|egg|seafood|dairy)/.test(lower)) {
      now.setDate(now.getDate() + 7); // 7 days
    } else if (/(lettuce|spinach|greens|vegetable|tomato|onion|potato|carrot|cabbage|pepper|broccoli|cauliflower|bean|pea|okra|zucchini|cucumber|mushroom)/.test(lower)) {
      now.setDate(now.getDate() + 5); // 5 days
    } else if (/(spice|salt|pepper|masala|herb|powder|dry|rice|lentil|bean|flour|grain|sugar|oil|vinegar|pasta|noodle|baking|yeast|nut|seed)/.test(lower)) {
      now.setMonth(now.getMonth() + 6); // 6 months
    } else if (/(frozen|ice|icecream)/.test(lower)) {
      now.setFullYear(now.getFullYear() + 1); // 1 year
    } else {
      now.setDate(now.getDate() + 14); // Default 2 weeks
    }
    return now.toISOString().slice(0, 10);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMenuItems([]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMenuItems([]);
    setError(null);
    setSuccess(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/menuCsv", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      setMenuItems(data.menuItems || []);
      if ((data.menuItems || []).length === 0) {
        setError("No menu items found in the file.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to extract menu items.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Ingredient table handlers
  const handleIngredientChange = (itemIdx: number, ingIdx: number, field: string, value: string | number) => {
    setMenuItems(prev => {
      const updated = [...prev];
      const ings = [...(updated[itemIdx].ingredients || [])];
      ings[ingIdx] = { ...ings[ingIdx], [field]: value };
      updated[itemIdx] = { ...updated[itemIdx], ingredients: ings };
      return updated;
    });
  };

  const handleAddIngredient = (itemIdx: number) => {
    setMenuItems(prev => {
      const updated = [...prev];
      const ings = [...(updated[itemIdx].ingredients || [])];
      ings.push({ name: "", quantity: 0, unit: "" });
      updated[itemIdx] = { ...updated[itemIdx], ingredients: ings };
      return updated;
    });
  };

  const handleRemoveIngredient = (itemIdx: number, ingIdx: number) => {
    setMenuItems(prev => {
      const updated = [...prev];
      const ings = [...(updated[itemIdx].ingredients || [])];
      ings.splice(ingIdx, 1);
      updated[itemIdx] = { ...updated[itemIdx], ingredients: ings };
      return updated;
    });
  };

  const handleToggleExpand = (idx: number) => {
    setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSaveMenu = async () => {
    if (!currentUser) {
      toast({ title: "Not logged in", description: "Please log in to save menu.", variant: "destructive" });
      return;
    }
    try {
      // Save menu to localStorage under menu_{userId}
      const key = `menu_${currentUser.id}`;
      localStorage.setItem(key, JSON.stringify(menuItems));
      console.log('Saved menu to localStorage:', key, menuItems);
      setSuccess(true);
      toast({ title: "Menu Saved", description: "Menu items have been saved to the system." });
    } catch (error) {
      setSuccess(false);
      toast({ title: "Error", description: "Failed to save menu." });
    }
  };

  const handleSaveIngredients = async () => {
    // TODO: Implement saving only ingredients to backend
    setSuccess(true);
    toast({ title: "Ingredients Saved", description: "Ingredients have been saved." });
  };

  const handleRefreshMenu = async () => {
    setUploading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/menuCsv?action=delete", { method: "POST" });
      if (!res.ok) throw new Error("Failed to refresh menu");
      setMenuItems([]);
      setFile(null);
      toast({ title: "Menu Reset", description: "Previous menu data deleted. You can now upload a new menu." });
    } catch (err: any) {
      setError(err.message || "Failed to refresh menu.");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleAddAllToInventory = (itemIdx: number) => {
    if (!currentUser) {
      toast({ title: "Not logged in", description: "Please log in to add to inventory.", variant: "destructive" });
      return;
    }
    const dish = menuItems[itemIdx];
    if (!dish.ingredients || dish.ingredients.length === 0) {
      toast({ title: "No ingredients", description: "No ingredients to add for this dish." });
      return;
    }
    // Prepare modal state
    setModalIngredients(
      dish.ingredients.filter((ing: any) => ing.name && ing.quantity > 0 && ing.unit).map((ing: any) => ({
        ...ing,
        expiryDate: getDefaultExpiry(ing.name),
      }))
    );
    setModalDish(dish.name);
    setModalOpen(true);
  };

  const handleAddIngredientToInventory = (itemIdx: number, ingIdx: number) => {
    if (!currentUser) {
      toast({ title: "Not logged in", description: "Please log in to add to inventory.", variant: "destructive" });
      return;
    }
    const dish = menuItems[itemIdx];
    const ing = dish.ingredients[ingIdx];
    if (ing.name && ing.quantity > 0 && ing.unit) {
      setModalIngredients([
        { ...ing, expiryDate: getDefaultExpiry(ing.name) }
      ]);
      setModalDish(dish.name);
      setModalOpen(true);
    } else {
      toast({ title: "Invalid ingredient", description: "Ingredient must have a name, quantity > 0, and unit.", variant: "destructive" });
    }
  };

  const handleModalExpiryChange = (idx: number, value: string) => {
    setModalIngredients(prev => prev.map((ing, i) => i === idx ? { ...ing, expiryDate: value } : ing));
  };

  const handleConfirmAddToInventory = () => {
    if (!currentUser) return;
    modalIngredients.forEach((ing: any) => {
      addOrUpdateIngredientInInventory(currentUser.id, {
        id: '',
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        category: modalDish,
        expiryDate: ing.expiryDate,
      });
    });
    toast({ title: "Added to Inventory", description: `${modalIngredients.length} item(s) added to inventory.` });
    setModalOpen(false);
  };

  return (
    <AppLayout pageTitle="Menu Upload">
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-muted/50">
        <Card className="w-full max-w-3xl shadow-lg">
          <CardHeader>
            <CardTitle>Menu Upload</CardTitle>
            <p className="text-sm text-gray-500 mt-1">by IOMS team</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <label className="w-full flex flex-col items-center px-4 py-8 bg-white rounded-lg shadow-md tracking-wide uppercase border border-blue-200 cursor-pointer hover:bg-blue-50 transition">
                <UploadCloud className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-base leading-normal mb-2">Select a PDF or CSV file to upload</span>
                <Input type="file" accept=".pdf,.csv" className="hidden" onChange={handleFileChange} />
                {file && <span className="text-sm text-gray-600 mt-2">{file.name}</span>}
              </label>
              <Button onClick={handleUpload} disabled={!file || uploading} className="w-full mt-2">
                {uploading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                {uploading ? "Extracting..." : "Extract Menu Items"}
              </Button>
              {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
              {menuItems.length > 0 && (
                <div className="w-full mt-6">
                  <div className="font-semibold mb-2">Extracted Menu Items:</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-sm">
                      <thead>
                        <tr>
                          <th className="border px-2 py-1">Expand</th>
                          <th className="border px-2 py-1">Name</th>
                          <th className="border px-2 py-1">Price</th>
                          <th className="border px-2 py-1">Category</th>
                          <th className="border px-2 py-1">Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuItems.map((item, idx) => (
                          <React.Fragment key={item.id || idx}>
                            <tr>
                              <td className="border px-2 py-1 text-center">
                                <Button variant="ghost" size="icon" onClick={() => handleToggleExpand(idx)}>
                                  {expandedRows[idx] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </td>
                              <td className="border px-2 py-1">{item.name}</td>
                              <td className="border px-2 py-1">{item.price}</td>
                              <td className="border px-2 py-1">{item.category}</td>
                              <td className="border px-2 py-1">{item.size ?? null}</td>
                            </tr>
                            {expandedRows[idx] && (
                              <tr>
                                <td colSpan={5} className="border px-2 py-1 bg-gray-50">
                                  <div className="mb-2 flex justify-between items-center">
                                    <span className="font-semibold">Ingredients</span>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline" onClick={() => handleAddIngredient(idx)}>
                                        <Plus className="h-4 w-4 mr-1" /> Add Ingredient
                                      </Button>
                                      <Button size="sm" variant="default" onClick={() => handleAddAllToInventory(idx)}>
                                        <Boxes className="h-4 w-4 mr-1" /> Add All to Inventory
                                      </Button>
                                    </div>
                                  </div>
                                  <table className="min-w-full border text-xs">
                                    <thead>
                                      <tr>
                                        <th className="border px-2 py-1">Name</th>
                                        <th className="border px-2 py-1">Quantity</th>
                                        <th className="border px-2 py-1">Unit</th>
                                        <th className="border px-2 py-1">Remove</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(item.ingredients || []).map((ing: any, ingIdx: number) => (
                                        <tr key={ingIdx}>
                                          <td className="border px-2 py-1">
                                            <Input
                                              value={ing.name}
                                              onChange={e => handleIngredientChange(idx, ingIdx, "name", e.target.value)}
                                              className="w-32"
                                            />
                                          </td>
                                          <td className="border px-2 py-1">
                                            <Input
                                              type="number"
                                              value={ing.quantity}
                                              onChange={e => handleIngredientChange(idx, ingIdx, "quantity", Number(e.target.value))}
                                              className="w-20"
                                            />
                                          </td>
                                          <td className="border px-2 py-1">
                                            <Input
                                              value={ing.unit}
                                              onChange={e => handleIngredientChange(idx, ingIdx, "unit", e.target.value)}
                                              className="w-16"
                                            />
                                          </td>
                                          <td className="border px-2 py-1 text-center flex gap-2 items-center justify-center">
                                            <Button size="icon" variant="destructive" onClick={() => handleRemoveIngredient(idx, ingIdx)}>
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="default" onClick={() => handleAddIngredientToInventory(idx, ingIdx)}>
                                              <Boxes className="h-4 w-4" />
                                            </Button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-4 mt-6 justify-end">
                    <Button onClick={handleSaveIngredients} variant="secondary">Save Ingredients</Button>
                    <Button onClick={handleSaveMenu} variant="default">Save Menu</Button>
                  </div>
                  {success && <div className="text-green-600 text-sm mt-2">Saved successfully!</div>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Add to Inventory</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <div className="font-semibold mb-2">Dish: {modalDish}</div>
            <table className="min-w-full border text-xs">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Ingredient</th>
                  <th className="border px-2 py-1">Quantity</th>
                  <th className="border px-2 py-1">Unit</th>
                  <th className="border px-2 py-1">Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {modalIngredients.map((ing, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{ing.name}</td>
                    <td className="border px-2 py-1">{ing.quantity}</td>
                    <td className="border px-2 py-1">{ing.unit}</td>
                    <td className="border px-2 py-1">
                      <input
                        type="date"
                        value={ing.expiryDate}
                        onChange={e => handleModalExpiryChange(idx, e.target.value)}
                        className="border rounded px-2 py-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmAddToInventory} variant="default">Confirm and Add to Inventory</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
} 