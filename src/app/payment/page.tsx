"use client";

import React, { useState, useEffect, useRef } from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, CreditCardIcon, SmartphoneNfcIcon, ReceiptTextIcon, Loader2, Home, Phone } from "lucide-react";
import { getPendingOrders, updateOrderStatus, Order, clearOccupiedTable } from '@/lib/orderService';
import { 
  recordIngredientUsageWithValidation, 
  validateDishAvailability 
} from '@/lib/posInventoryIntegration';
import { getDishes } from '@/lib/menuService';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentPage() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  // Replace selectedTable and related logic with selectedOrderId
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  // Add payment mode state
  const [paymentMode, setPaymentMode] = useState<string>("card");

  const billDetailsRef = useRef<HTMLDivElement>(null);

  const loadPendingOrders = () => {
    async function fetchActiveOrders() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/orders');
        const data = await res.json();
        // Show all non-completed orders (dine-in, take-away, delivery)
        const pendingOrders = data.orders.filter((order: any) => order.status !== 'Completed');
        setActiveOrders(pendingOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setActiveOrders([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchActiveOrders();
  };

  useEffect(() => {
    loadPendingOrders();
  }, [currentUser]);

  // Remove this conflicting useEffect that only shows dine-in orders

  // Compute selectedOrder based on selectedOrderId
  const selectedOrder = activeOrders.find(order => order.id === selectedOrderId);

  const subtotal = selectedOrder?.subtotal || 0;
  const tax = selectedOrder?.taxAmount || 0;
  // Fallback helpers for order fields
  const getOrderTotal = (order: any) => {
    if (!order) return 0;
    return order.totalAmount ?? order.total ?? 0;
  };
  const getOrderCreatedAt = (order: any) => {
    if (!order) return new Date().toISOString();
    return order.createdAt ?? order.timestamp ?? new Date().toISOString();
  };
  const getOrderCustomerName = (order: any) => {
    if (!order) return '';
    return order.customerName ?? order.customerInfo?.name ?? '';
  };
  const getOrderTable = (order: any) => {
    if (!order) return '';
    return order.table ?? order.customerInfo?.tableNumber ?? '';
  };
  // For totalDue, use getOrderTotal(selectedOrder)
  const totalDue = getOrderTotal(selectedOrder);

  const handleOrderSelection = (orderId: string) => {
    setSelectedOrderId(orderId); // Set the selected table/order ID
    const order = activeOrders.find(o => o.id === orderId);
    if (order) {
      // Reset tipAmount when a new order is selected to avoid carrying over tips
      const newTipAmount = 0; 
      setTipAmount(newTipAmount);
      setAmountPaid(Number(order.totalAmount) + Number(newTipAmount)); 
    } else {
      setAmountPaid(0);
      setTipAmount(0);
    }
  };
  
  useEffect(() => {
    if (selectedOrder) {
      setAmountPaid(selectedOrder.totalAmount + tipAmount);
    }
  }, [tipAmount, selectedOrder]);


  const handleProcessPayment = async () => {
    if (!currentUser) {
      toast({ title: "Error", description: "Please log in.", variant: "destructive" });
      return;
    }
    if (!selectedOrder) {
      toast({ title: "Error", description: "Please select an order to process payment.", variant: "destructive" });
      return;
    }
    if (paymentMode === "cash" && amountPaid < totalDue) {
      toast({ title: "Error", description: `Cash paid ($${String((typeof amountPaid === 'number' && !isNaN(amountPaid) ? amountPaid : parseFloat(amountPaid) || 0).toFixed(2))}) is less than total due ($${String((typeof totalDue === 'number' && !isNaN(totalDue) ? totalDue : parseFloat(totalDue) || 0).toFixed(2))}).`, variant: "destructive" });
      return;
    }

    // Cache order id for toast before any state changes
    const orderIdShort = selectedOrder?.id ? selectedOrder.id.substring(0,12) : 'N/A';

    try {
      // PATCH the order status via API
      const patchRes = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOrder.id,
          status: 'Completed',
          paymentMode,
          tipAmount,
          amountPaid,
          userId: currentUser.id, // Add userId for inventory updates
        }),
      });
      
      if (patchRes.ok) {
        const { order: processedOrder } = await patchRes.json();
        
        // Remove the completed order from activeOrders
        setActiveOrders(prev => prev.filter(o => o.id !== processedOrder.id));
        // Optionally, refresh orders from API - show all non-completed orders
        const resOrders = await fetch('/api/orders');
        const dataOrders = await resOrders.json();
        setActiveOrders(dataOrders.orders.filter((o: any) => o.status !== 'Completed'));
        if (processedOrder.orderType === 'dine-in' && processedOrder.customerInfo?.tableNumber) {
          // Free the table after payment
          await fetch('/api/tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'free', tableId: processedOrder.customerInfo.tableNumber })
          });
        }
        
        // Generate PDF bill in new tab
        generatePDFBill(processedOrder);
        
        // Show success message
        let successMessageTableInfo = processedOrder.orderType === 'delivery' ? `Delivery for ${processedOrder.customerName}` : 
                                     processedOrder.orderType === 'take-away' ? `Take Away for ${processedOrder.customerInfo?.name || 'Customer'}` :
                                     `Table ${processedOrder.table} is now free`;
        toast({ 
          title: "Payment Successful!", 
          description: `Processed $${String((typeof totalDue === 'number' && !isNaN(totalDue) ? totalDue : parseFloat(totalDue) || 0).toFixed(2))} for order ${orderIdShort}... via ${paymentMode}. ${successMessageTableInfo}. Bill generated in new tab.` 
        });
        // Refresh orders and tables
        async function refreshData() {
          const resOrders = await fetch('/api/orders');
          const dataOrders = await resOrders.json();
          setActiveOrders(dataOrders.orders.filter((o: any) => o.orderType === 'dine-in' && o.status !== 'Completed'));
          const resTables = await fetch('/api/tables');
          const dataTables = await resTables.json();
          // Optionally update table state if you have it in the UI
        }
        refreshData();
        setPaymentMode("card");
        setAmountPaid(0);
        setTipAmount(0);
      } else {
        const errorText = await patchRes.text();
        toast({ title: "Error", description: "Failed to update order status.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An error occurred while processing payment.", variant: "destructive" });
    }
  };

  const generatePDFBill = (order: any) => {
    // Create a new window/tab for the bill
    const billWindow = window.open('', '_blank');
    if (!billWindow) {
      toast({ title: "Warning", description: "Please allow popups to generate the bill.", variant: "destructive" });
      return;
    }

    // Generate the bill HTML content
    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill - Order ${order.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .restaurant-name { font-size: 24px; font-weight: bold; }
          .order-info { margin-bottom: 20px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items-table th { background-color: #f2f2f2; }
          .total-section { border-top: 2px solid #000; padding-top: 10px; }
          .total-row { font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="restaurant-name">Restaurant Name</div>
          <div>123 Main Street, City, State</div>
          <div>Phone: (555) 123-4567</div>
        </div>
        
        <div class="order-info">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Date:</strong> ${new Date(getOrderCreatedAt(order)).toLocaleString()}</p>
          <p><strong>Order Type:</strong> ${order.orderType}</p>
          ${order.orderType === 'dine-in' ? `<p><strong>Table:</strong> ${getOrderTable(order)}</p>` : ''}
          ${order.orderType === 'take-away' || order.orderType === 'delivery' ? `<p><strong>Customer:</strong> ${getOrderCustomerName(order)}</p>` : ''}
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map((item: any) => {
              const name = item.menuItem?.name ?? item.name ?? '';
              const quantity = item.quantity ?? 1;
              let price = 0;
              if (item.unitPrice) {
                price = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice.replace(/[^\d.]/g, '')) : item.unitPrice;
              } else if (item.price) {
                price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : item.price;
              } else if (item.menuItem?.price) {
                price = typeof item.menuItem.price === 'string' ? parseFloat(item.menuItem.price.replace(/[^\d.]/g, '')) : item.menuItem.price;
              } else if (item.name) {
                const priceMatch = item.name.match(/(\d+[.,]?\d*)\s*(EUR|€|\$)/i);
                if (priceMatch) {
                  price = parseFloat(priceMatch[1].replace(',', '.'));
                }
              }
              const total = price * quantity;
              return `
                <tr>
                  <td>${name}</td>
                  <td>${quantity}</td>
                  <td>$${String(price.toFixed(2))}</td>
                  <td>$${String(total.toFixed(2))}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="total-section">
          <table style="width: 100%;">
            <tr><td>Subtotal:</td><td style="text-align: right;">$${String((() => {
              let subtotal = 0;
              order.items.forEach((item: any) => {
                const quantity = item.quantity ?? 1;
                let price = 0;
                if (item.unitPrice) {
                  price = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice.replace(/[^\d.]/g, '')) : item.unitPrice;
                } else if (item.price) {
                  price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : item.price;
                } else if (item.menuItem?.price) {
                  price = typeof item.menuItem.price === 'string' ? parseFloat(item.menuItem.price.replace(/[^\d.]/g, '')) : item.menuItem.price;
                } else if (item.name) {
                  const priceMatch = item.name.match(/(\d+[.,]?\d*)\s*(EUR|€|\$)/i);
                  if (priceMatch) {
                    price = parseFloat(priceMatch[1].replace(',', '.'));
                  }
                }
                subtotal += price * quantity;
              });
              return subtotal.toFixed(2);
            })())}</td></tr>
            <tr><td>Tax:</td><td style="text-align: right;">$${String((order.taxAmount || 0).toFixed(2))}</td></tr>
            ${tipAmount > 0 ? `<tr><td>Tip:</td><td style="text-align: right;">$${String(tipAmount.toFixed(2))}</td></tr>` : ''}
            <tr class="total-row"><td><strong>Total:</strong></td><td style="text-align: right;"><strong>$${String(totalDue.toFixed(2))}</strong></td></tr>
            <tr><td>Payment Method:</td><td style="text-align: right;">${paymentMode}</td></tr>
            ${paymentMode === 'cash' ? `<tr><td>Amount Paid:</td><td style="text-align: right;">$${String(amountPaid.toFixed(2))}</td></tr>` : ''}
            ${paymentMode === 'cash' && amountPaid > totalDue ? `<tr><td>Change:</td><td style="text-align: right;">$${String((amountPaid - totalDue).toFixed(2))}</td></tr>` : ''}
          </table>
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Write the HTML to the new window
    billWindow.document.write(billHTML);
    billWindow.document.close();
    
    // Auto-print the bill
    setTimeout(() => {
      billWindow.print();
    }, 500);
  };

  const getOrderDisplayName = (order: any) => {
    if (!order) return 'No order selected';
    
    if (order.orderType === 'take-away' || order.orderType === 'takeaway') {
      const customerName = getOrderCustomerName(order);
      return customerName ? `Take Away - ${customerName}` : 'Take Away Order';
    } else if (order.orderType === 'delivery') {
      const customerName = getOrderCustomerName(order);
      return customerName ? `Delivery - ${customerName}` : 'Delivery Order';
    } else if (order.orderType === 'dine-in') {
      const tableNumber = getOrderTable(order);
      return tableNumber ? `Table ${tableNumber}` : 'Dine In Order';
    } else {
      return `Order ${order.id ? order.id.substring(0, 8) : 'Unknown'}`;
    }
  };

  const getOrderDetails = (order: any) => {
    const orderType = order.orderType || 'unknown';
    const customerName = order.customerInfo?.name || order.customerName || '';
    const tableNumber = order.customerInfo?.tableNumber || order.table || '';
    const phone = order.customerInfo?.phone || '';
    const email = order.customerInfo?.email || '';
    
    if (orderType === 'dine-in') {
      return `Table ${tableNumber}`;
    } else if (orderType === 'take-away') {
      return `${customerName}${phone ? ` (${phone})` : ''}`;
    } else if (orderType === 'delivery' || orderType === 'home-delivery') {
      return `${customerName}${phone ? ` (${phone})` : ''}${email ? ` - ${email}` : ''}`;
    }
    return 'Unknown order type';
  };

  return (
    <AppLayout pageTitle="Payment Processing">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><ReceiptTextIcon className="mr-2 h-6 w-6" /> Process Payment</CardTitle>
              <CardDescription>Select a pending order, choose payment method, and complete the transaction.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Select Order for Payment</CardTitle>
                  {selectedOrder && (
                    <CardDescription className="text-green-600 font-medium">
                      ✓ Selected: {getOrderDisplayName(selectedOrder)} ({selectedOrder.orderType})
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Order select dropdown */}
                  <select
                    value={selectedOrderId ? String(selectedOrderId) : ''}
                    onChange={e => {
                      setSelectedOrderId(e.target.value || null);
                      const order = activeOrders.find(o => o.id === e.target.value);
                      if (order) {
                        setTipAmount(0);
                        setAmountPaid(Number(order.totalAmount) + 0);
                      } else {
                        setAmountPaid(0);
                        setTipAmount(0);
                      }
                    }}
                    className="w-full border rounded px-2 py-2"
                  >
                    <option value="">Select order</option>
                    {activeOrders.filter(order => order.status !== 'Completed').map((order, idx) => (
                      <option
                        key={order.id || `order-idx-${idx}`}
                        value={order.id ? String(order.id) : ''}
                      >
                        {getOrderDisplayName(order)} - €{String(getOrderTotal(order).toFixed(2))}
                      </option>
                    ))}
                  </select>
                  
                </CardContent>
              </Card>

              <div>
                <Label>Payment Mode</Label>
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="paymentMode" value="card" checked={paymentMode === 'card'} onChange={() => setPaymentMode('card')} />
                    Card
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="paymentMode" value="cash" checked={paymentMode === 'cash'} onChange={() => setPaymentMode('cash')} />
                    Cash
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="paymentMode" value="mobile" checked={paymentMode === 'mobile'} onChange={() => setPaymentMode('mobile')} />
                    Mobile
                  </label>
                </div>
              </div>
              
              {selectedOrder && (
                 <div>
                    <Label htmlFor="tip-amount">Tip Amount</Label>
                    <Input 
                      id="tip-amount" 
                      type="number" 
                      value={String(tipAmount)} 
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setTipAmount(isNaN(value) ? 0 : Math.max(0, value));
                      }} 
                      placeholder="Enter tip amount (optional)" 
                      min="0"
                      step="0.01"
                    />
                  </div>
              )}

              {selectedOrder && paymentMode === "cash" && (
                <div>
                  <Label htmlFor="amount-paid">Amount Paid by Customer (Cash)</Label>
                  <Input 
                    id="amount-paid" 
                    type="number" 
                    value={String(amountPaid)} 
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setAmountPaid(isNaN(value) ? 0 : value);
                    }} 
                    placeholder="Enter amount paid" 
                    min="0"
                    step="0.01"
                  />
                  {/* Change due prompt */}
                  {amountPaid > 0 && totalDue > 0 && (
                    <div className={amountPaid >= totalDue ? "mt-2 p-2 rounded bg-green-100 text-green-800 font-semibold" : "mt-2 p-2 rounded bg-red-100 text-red-800 font-semibold"}>
                      {amountPaid >= totalDue
                        ? `Change to return: $${String((amountPaid - totalDue).toFixed(2))}`
                        : `Amount paid is less than total due by $${String((totalDue - amountPaid).toFixed(2))}`}
                    </div>
                  )}
                </div>
              )}

            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleProcessPayment}
                className="w-full"
                size="lg"
                disabled={!selectedOrder || isLoading || !currentUser}
              >
                {(() => {
                  // Show euro if any item in order uses euro pricing
                  if (selectedOrder) {
                    let hasEuro = false;
                    let euroTotal = 0;
                    selectedOrder.items.forEach((item: any) => {
                      let priceStr = item.unitPrice && item.unitPrice.toString().trim() ? item.unitPrice : item.name && item.name.match(/(\d+[.,]?\d*)\s*(EUR|€)/i)?.[0];
                      if (priceStr && /(EUR|€)/i.test(priceStr.toString())) {
                        hasEuro = true;
                        const match = priceStr.toString().match(/(\d+[.,]?\d*)/);
                        if (match) euroTotal += parseFloat(match[1].replace(',', '.')) * item.quantity;
                      }
                    });
                    if (hasEuro) {
                      return `Process Payment (\u20AC${String(euroTotal.toFixed(2))})`;
                    }
                  }
                  return `Process Payment ($${String((typeof totalDue === 'number' && !isNaN(totalDue) ? totalDue : parseFloat(totalDue) || 0).toFixed(2))})`;
                })()}
              </Button>
              
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-1">
          {selectedOrder ? (
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>
                  {selectedOrder?.id ? `ID: ${selectedOrder.id.substring(0,12)}...` : 'No order selected'}
                </CardDescription>
              </CardHeader>
              <CardContent ref={billDetailsRef} className="space-y-3">
                <div className="bill-header-placeholder hidden print:block bill-header"></div>
                {selectedOrder.orderType === 'delivery' && (
                  <div className="bill-section delivery-info">
                    <h2 className="font-semibold print:text-lg">Delivery Details</h2>
                    <p><strong>Customer:</strong> {getOrderCustomerName(selectedOrder)}</p>
                    <p className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground"/> {selectedOrder.customerPhone}</p>
                    <p className="flex items-start"><Home className="mr-2 mt-1 h-4 w-4 text-muted-foreground"/> {selectedOrder.customerAddress}</p>
                    <p><strong>Driver:</strong> {selectedOrder.driverName}</p>
                  </div>
                )}
                 {selectedOrder.orderType === 'dine-in' && (
                  <p className="text-sm text-muted-foreground print:hidden">Table: {getOrderTable(selectedOrder)}</p>
                )}
                <Separator className={selectedOrder.orderType === 'delivery' ? 'my-3' : 'hidden'}/>
                <div className="bill-section">
                  <h2 className="font-semibold print:text-lg">Items</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left font-normal">Item</th>
                        <th className="text-center font-normal">Qty</th>
                        <th className="text-right font-normal">Price</th>
                        <th className="text-right font-normal">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item: any, index: any) => {
                        // Get item details with better price extraction
                        const name = item.menuItem?.name ?? item.name ?? '';
                        const quantity = item.quantity ?? 1;
                        
                        // Try multiple price sources
                        let price = 0;
                        if (item.unitPrice) {
                          price = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice.replace(/[^\d.]/g, '')) : item.unitPrice;
                        } else if (item.price) {
                          price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : item.price;
                        } else if (item.menuItem?.price) {
                          price = typeof item.menuItem.price === 'string' ? parseFloat(item.menuItem.price.replace(/[^\d.]/g, '')) : item.menuItem.price;
                        } else if (name) {
                          // Extract price from name if it contains price info
                          const priceMatch = name.match(/(\d+[.,]?\d*)\s*(EUR|€|\$)/i);
                          if (priceMatch) {
                            price = parseFloat(priceMatch[1].replace(',', '.'));
                          }
                        }
                        
                        const total = (price * quantity) || 0;
                        
                        return (
                          <tr key={String(index)}>
                            <td>{name}</td>
                            <td className="text-center">{String(quantity)}</td>
                            <td className="text-right">${String(price.toFixed(2))}</td>
                            <td className="text-right">${String(total.toFixed(2))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Separator/>
                <div className="bill-section">
                  <h2 className="font-semibold print:text-lg">Summary</h2>
                  <table className="w-full text-sm totals-table">
                      <tbody>
                        <tr><td>Subtotal:</td><td className="text-right strong">{(() => {
                          let subtotal = 0;
                          selectedOrder.items.forEach((item: any) => {
                            const quantity = item.quantity ?? 1;
                            
                            // Use the same price extraction logic as above
                            let price = 0;
                            if (item.unitPrice) {
                              price = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice.replace(/[^\d.]/g, '')) : item.unitPrice;
                            } else if (item.price) {
                              price = typeof item.price === 'string' ? parseFloat(item.price.replace(/[^\d.]/g, '')) : item.price;
                            } else if (item.menuItem?.price) {
                              price = typeof item.menuItem.price === 'string' ? parseFloat(item.menuItem.price.replace(/[^\d.]/g, '')) : item.menuItem.price;
                            } else if (item.name) {
                              const priceMatch = item.name.match(/(\d+[.,]?\d*)\s*(EUR|€|\$)/i);
                              if (priceMatch) {
                                price = parseFloat(priceMatch[1].replace(',', '.'));
                              }
                            }
                            
                            subtotal += price * quantity;
                          });
                          
                          return `$${String(subtotal.toFixed(2))}`;
                        })()}</td></tr>
                        <tr><td>Tax ({(() => {
                          let hasEuro = false;
                          selectedOrder.items.forEach((item: any) => {
                            let priceStr = item.unitPrice && item.unitPrice.toString().trim() ? item.unitPrice : item.name && item.name.match(/(\d+[.,]?\d*)\s*(EUR|€)/i)?.[0];
                            if (priceStr && /(EUR|€)/i.test(priceStr.toString())) {
                              hasEuro = true;
                            }
                          });
                          return hasEuro ? '€' : '$';
                        })()}{String((typeof selectedOrder.taxRate === 'number' && !isNaN(selectedOrder.taxRate) ? selectedOrder.taxRate * 100 : 0).toFixed(0))}%):</td><td className="text-right strong">{(() => {
                          let tax = 0;
                          let hasEuro = false;
                          selectedOrder.items.forEach((item: any) => {
                            let priceStr = item.unitPrice && item.unitPrice.toString().trim() ? item.unitPrice : item.name && item.name.match(/(\d+[.,]?\d*)\s*(EUR|€)/i)?.[0];
                            if (priceStr && /(EUR|€)/i.test(priceStr.toString())) {
                              hasEuro = true;
                              const match = priceStr.toString().match(/(\d+[.,]?\d*)/);
                              if (match) tax += parseFloat(match[1].replace(',', '.')) * item.quantity * (selectedOrder.taxRate || 0);
                            }
                          });
                          if (hasEuro) {
                            return `€${String(tax.toFixed(2))}`;
                          } else {
                            return `$${String((typeof tax === 'number' && !isNaN(tax) ? tax : parseFloat(tax) || 0).toFixed(2))}`;
                          }
                        })()}</td></tr>
                        {tipAmount > 0 && <tr><td>Tip:</td><td className="text-right strong">{(() => {
                          let hasEuro = false;
                          selectedOrder.items.forEach((item: any) => {
                            let priceStr = item.unitPrice && item.unitPrice.toString().trim() ? item.unitPrice : item.name && item.name.match(/(\d+[.,]?\d*)\s*(EUR|€)/i)?.[0];
                            if (priceStr && /(EUR|€)/i.test(priceStr.toString())) {
                              hasEuro = true;
                            }
                          });
                          return hasEuro ? `€${String((typeof tipAmount === 'number' && !isNaN(tipAmount) ? tipAmount : parseFloat(tipAmount) || 0).toFixed(2))}` : `$${String((typeof tipAmount === 'number' && !isNaN(tipAmount) ? tipAmount : parseFloat(tipAmount) || 0).toFixed(2))}`;
                        })()}</td></tr>}
                        <tr className="text-lg border-t mt-1 pt-1"><td className="font-bold">Total Due:</td><td className="text-right font-bold strong">{(() => {
                          let total = 0;
                          let hasEuro = false;
                          selectedOrder.items.forEach((item: any) => {
                            let priceStr = item.unitPrice && item.unitPrice.toString().trim() ? item.unitPrice : item.name && item.name.match(/(\d+[.,]?\d*)\s*(EUR|€)/i)?.[0];
                            if (priceStr && /(EUR|€)/i.test(priceStr.toString())) {
                              hasEuro = true;
                              const match = priceStr.toString().match(/(\d+[.,]?\d*)/);
                              if (match) total += parseFloat(match[1].replace(',', '.')) * item.quantity;
                            }
                          });
                          let tax = (selectedOrder.taxRate || 0) * total;
                          total += tax;
                          if (tipAmount > 0) total += tipAmount;
                          if (hasEuro) {
                            return `€${String(total.toFixed(2))}`;
                          } else {
                            return `$${String((typeof totalDue === 'number' && !isNaN(totalDue) ? totalDue : parseFloat(totalDue) || 0).toFixed(2))}`;
                          }
                        })()}</td></tr>
                      </tbody>
                  </table>
                </div>
                 <p className="text-xs text-muted-foreground print:hidden">Order Type: <span className="capitalize">{selectedOrder.orderType}</span></p>
                 <p className="text-xs text-muted-foreground print:hidden">Created: {new Date(getOrderCreatedAt(selectedOrder)).toLocaleString()}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-full">
              <CardContent>
                <p className="text-muted-foreground">No order selected.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
