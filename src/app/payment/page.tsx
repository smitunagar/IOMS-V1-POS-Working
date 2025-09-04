"use client";

import React, { useState, useEffect, useRef, ReactNode, ChangeEvent } from 'react';
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
import { getInventory, saveInventory } from '@/lib/inventoryService';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

const PaymentPage: React.FC = () => {
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
        
        // First, sync inventory from localStorage to server
        if (currentUser) {
          const localInventory = getInventory(currentUser.id);
          await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              inventory: localInventory,
              action: 'sync'
            })
          });
        }
        
        const res = await fetch('/api/orders');
        const data = await res.json();
        // Show all non-completed orders (dine-in, take-away, delivery) created via Order Entry
        const pendingOrders = data.orders.filter((order: any) => order.status !== 'Completed' && order.source === 'order-entry');
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
  const selectedOrder = activeOrders.find((order: any) => order.id === selectedOrderId);

  const subtotal = selectedOrder?.subtotal || 0;
  const tax = selectedOrder?.taxAmount || 0;
  // Fallback helpers for order fields
  const getOrderTotal = (order: any): number => {
    if (!order) return 0;
    return order.totalAmount ?? order.total ?? 0;
  };
  const getOrderCreatedAt = (order: any): string => {
    if (!order) return new Date().toISOString();
    return order.createdAt ?? order.timestamp ?? new Date().toISOString();
  };
  const getOrderCustomerName = (order: any): string => {
    if (!order) return '';
    return order.customerName ?? order.customerInfo?.name ?? '';
  };
  const getOrderTable = (order: any): string => {
    if (!order) return '';
    return order.table ?? order.customerInfo?.tableNumber ?? '';
  };
  // For totalDue, use getOrderTotal(selectedOrder)
  const totalDue = getOrderTotal(selectedOrder);

  const handleOrderSelection = (orderId: string): void => {
    setSelectedOrderId(orderId); // Set the selected table/order ID
    const order = activeOrders.find((o: any) => o.id === orderId);
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


  const handleProcessPayment = async (): Promise<void> => {
    if (!currentUser) {
      toast({ title: "Error", description: "Please log in.", variant: "destructive" });
      return;
    }
    if (!selectedOrder) {
      toast({ title: "Error", description: "Please select an order to process payment.", variant: "destructive" });
      return;
    }
    if (paymentMode === "cash" && amountPaid < totalDue) {
      const paid = typeof amountPaid === 'number' && !isNaN(amountPaid)
        ? amountPaid
        : (typeof amountPaid === 'string' ? parseFloat(amountPaid) : 0);
      const due = typeof totalDue === 'number' && !isNaN(totalDue)
        ? totalDue
        : (typeof totalDue === 'string' ? parseFloat(totalDue) : 0);
      toast({ title: "Error", description: `Cash paid ($${paid.toFixed(2)}) is less than total due ($${due.toFixed(2)}).`, variant: "destructive" });
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
        
        // Sync updated inventory back to localStorage
        if (currentUser) {
          const serverInventoryRes = await fetch(`/api/inventory?userId=${currentUser.id}`);
          const { inventory: serverInventory } = await serverInventoryRes.json();
          saveInventory(currentUser.id, serverInventory);
        }
        
        // Remove the completed order from activeOrders
        setActiveOrders((prev: any[]) => prev.filter((o: any) => o.id !== processedOrder.id));
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
        await generatePDFBill(processedOrder);
        
        // Show success message
        let successMessageTableInfo = processedOrder.orderType === 'delivery' ? `Delivery for ${processedOrder.customerName}` : 
                                     processedOrder.orderType === 'take-away' ? `Take Away for ${processedOrder.customerInfo?.name || 'Customer'}` :
                                     `Table ${processedOrder.table} is now free`;
        let due: number = 0;
        if (typeof totalDue === 'number' && !isNaN(totalDue)) {
          due = totalDue;
        } else if (typeof totalDue === 'string') {
          const parsed = parseFloat(totalDue);
          due = isNaN(parsed) ? 0 : parsed;
        }
        toast({ 
          title: "Payment Successful!", 
          description: `Processed $${due.toFixed(2)} for order ${orderIdShort}... via ${paymentMode}. ${successMessageTableInfo}. Bill generated in new tab.` 
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

  const generatePDFBill = async (order: any): Promise<void> => {
    const doc = new jsPDF({ unit: 'mm', format: [80, 200] }); // Thermal receipt size
    let y = 10;
    doc.setFontSize(14);
    doc.text('Restaurant Name', 40, y, { align: 'center' });
    y += 6;
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(getOrderCreatedAt(order)).toLocaleString()}`, 5, y);
    y += 5;
    doc.text(`Table: ${getOrderTable(order) || '-'}`, 5, y);
    y += 5;
    doc.text(`Order: ${order.id.slice(-6)}`, 5, y);
    y += 5;
    doc.text(`Server: ${order.userId || '-'}`, 5, y);
    y += 8;
    doc.setFontSize(12);
    doc.text('Items', 5, y);
    y += 5;
    doc.setFontSize(10);
    order.items.forEach((item: any) => {
      doc.text(`${item.menuItem?.name || item.name} x${item.quantity}`, 5, y);
      doc.text(`€${(item.unitPrice || item.price || 0).toFixed(2)}`, 60, y, { align: 'right' });
      y += 5;
    });
    y += 2;
    doc.setLineWidth(0.1);
    doc.line(5, y, 75, y);
    y += 3;
    doc.text(`Subtotal:`, 5, y);
    doc.text(`€${order.subtotal ? order.subtotal.toFixed(2) : getOrderTotal(order).toFixed(2)}`, 60, y, { align: 'right' });
    y += 5;
    doc.text(`Tax:`, 5, y);
    doc.text(`€${order.taxAmount ? order.taxAmount.toFixed(2) : '0.00'}`, 60, y, { align: 'right' });
    y += 5;
    doc.text(`Discount:`, 5, y);
    doc.text(`-€${order.discount ? order.discount.toFixed(2) : '0.00'}`, 60, y, { align: 'right' });
    y += 5;
    doc.setFontSize(12);
    doc.text(`Total:`, 5, y);
    doc.text(`€${getOrderTotal(order).toFixed(2)}`, 60, y, { align: 'right' });
    y += 7;
    doc.setFontSize(10);
    doc.text(`Payment: ${order.paymentMode || 'N/A'}`, 5, y);
    y += 7;
    doc.setFontSize(11);
    doc.text('Thank you for your business!', 40, y, { align: 'center' });
    y += 8;
    // Generate QR code for feedback
    const feedbackUrl = 'https://your-feedback-url.com';
    const qrDataUrl = await QRCode.toDataURL(feedbackUrl);
    doc.addImage(qrDataUrl, 'PNG', 25, y, 30, 30);
    y += 32;
    doc.setFontSize(8);
    doc.text('Scan QR for feedback', 40, y, { align: 'center' });
    // Open PDF in new tab
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  const getOrderDisplayName = (order: any): string => {
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

  const getOrderDetails = (order: any): string => {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Panel: Order Selection */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Pending Orders</CardTitle>
                <CardDescription>Search and select an order to process payment.</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search by Table No, Order No, or Customer"
                  className="mb-4"
                  onChange={e => {
                    const val = e.target.value.toLowerCase();
                    setActiveOrders(prev => prev.map(o => ({ ...o, _hidden: !(
                      (o.table && o.table.toString().toLowerCase().includes(val)) ||
                      (o.id && o.id.toLowerCase().includes(val)) ||
                      (o.customerInfo?.name && o.customerInfo.name.toLowerCase().includes(val))
                    ) })));
                  }}
                />
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {activeOrders.length === 0 && (
                    <div className="text-muted-foreground text-center py-8">No pending orders.</div>
                  )}
                  {activeOrders.filter(o => !o._hidden).map((order: any) => (
                    <Card key={order.id} className={`border-2 ${selectedOrderId === order.id ? 'border-blue-500 bg-blue-50' : 'border-transparent'} transition-all`}> 
                      <CardContent className="p-3 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-base">Table {getOrderTable(order) || '-'}</div>
                            <div className="text-xs text-muted-foreground">Order #{order.id.slice(-6)}</div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-lg">€{getOrderTotal(order).toFixed(2)}</span>
                            <span className="text-xs text-muted-foreground">{new Date(getOrderCreatedAt(order)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">Pending</span>
                          <Button size="sm" className="ml-auto" onClick={() => handleOrderSelection(order.id)}>
                            Pay Now
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Right Panel: Payment Panel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Payment</CardTitle>
                <CardDescription>Review order and process payment.</CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedOrder ? (
                  <div className="text-muted-foreground text-center py-12">Select an order from the left panel.</div>
                ) : (
                  <>
                    {/* Order Summary */}
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Order Summary</h3>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">Order:</span> {getOrderDisplayName(selectedOrder)}</div>
                        <div><span className="font-medium">Details:</span> {getOrderDetails(selectedOrder)}</div>
                        <div><span className="font-medium">Date:</span> {getOrderCreatedAt(selectedOrder)}</div>
                        <div><span className="font-medium">Status:</span> <span className={`px-2 py-1 rounded text-xs font-semibold ${selectedOrder.status === 'Completed' ? 'bg-green-100 text-green-700' : selectedOrder.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{selectedOrder.status}</span></div>
                      </div>
                      <Separator className="my-3" />
                      <div className="text-sm max-h-32 overflow-y-auto border rounded p-2 bg-gray-50">
                        <div className="mb-2 font-medium">Items:</div>
                        <ul className="list-disc ml-5">
                          {selectedOrder.items.map((item: any, idx: number) => (
                            <li key={idx}>{item.menuItem?.name || item.name} × {item.quantity} <span className="text-muted-foreground">@ €{(item.unitPrice || item.price || 0).toFixed(2)}</span></li>
                          ))}
                        </ul>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between font-semibold">
                        <span>Subtotal</span>
                        <span>€{selectedOrder.subtotal ? selectedOrder.subtotal.toFixed(2) : getOrderTotal(selectedOrder).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>€{selectedOrder.taxAmount ? selectedOrder.taxAmount.toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount</span>
                        <span>-€{selectedOrder.discount ? selectedOrder.discount.toFixed(2) : '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold mt-2">
                        <span>Total</span>
                        <span>€{getOrderTotal(selectedOrder).toFixed(2)}</span>
                      </div>
                    </div>
                    {/* Payment Method */}
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Payment Method</h3>
                      <div className="flex gap-3 mb-2 flex-wrap">
                        <Button variant={paymentMode === 'card' ? 'default' : 'outline'} onClick={() => setPaymentMode('card')}><CreditCardIcon className="mr-2 h-4 w-4" />Card</Button>
                        <Button variant={paymentMode === 'cash' ? 'default' : 'outline'} onClick={() => setPaymentMode('cash')}><DollarSign className="mr-2 h-4 w-4" />Cash</Button>
                        <Button variant={paymentMode === 'qr' ? 'default' : 'outline'} onClick={() => setPaymentMode('qr')}><SmartphoneNfcIcon className="mr-2 h-4 w-4" />QR</Button>
                        <Button variant={paymentMode === 'gift' ? 'default' : 'outline'} onClick={() => setPaymentMode('gift')}><ReceiptTextIcon className="mr-2 h-4 w-4" />Gift Card</Button>
                        <Button variant={paymentMode === 'split' ? 'default' : 'outline'} onClick={() => setPaymentMode('split')} disabled><ReceiptTextIcon className="mr-2 h-4 w-4" />Split Payment</Button>
                      </div>
                    </div>
                    {/* Amount Received (for cash) */}
                    {paymentMode === 'cash' && (
                      <div className="mb-4">
                        <Label htmlFor="amountPaid">Amount Received</Label>
                        <Input
                          id="amountPaid"
                          type="number"
                          value={amountPaid}
                          onChange={e => setAmountPaid(Number(e.target.value))}
                          min={getOrderTotal(selectedOrder)}
                          className="mt-1"
                        />
                      </div>
                    )}
                    {/* Tip Input */}
                    <div className="mb-4">
                      <Label htmlFor="tipAmount">Tip (optional)</Label>
                      <Input
                        id="tipAmount"
                        type="number"
                        value={tipAmount}
                        onChange={e => setTipAmount(Number(e.target.value))}
                        min={0}
                        className="mt-1"
                      />
                    </div>
                    {/* Process Payment Button */}
                    <Button className="w-full mt-4" onClick={async () => { await handleProcessPayment(); toast({ title: 'Payment Success', description: '✅ Payment processed successfully.' }); if (selectedOrder) await generatePDFBill(selectedOrder); }} disabled={isLoading}>
                      {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                      Process Payment
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default PaymentPage;