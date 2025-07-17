"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { PlusCircle, RefreshCw, Pencil, Trash2, AlertTriangle, Upload, Download, X, Mic, MicOff, MessageCircle, Send, Bell, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from '@/hooks/use-toast';
import { getInventory, updateInventoryItem, removeInventoryItem, addInventoryItem, clearAllInventory, InventoryItem, batchAddOrUpdateInventoryItems, ProcessedCSVItem } from '@/lib/inventoryService'; 
import { analyzeCSV, convertCSV, generateTemplateCSV, CSVAnalysis, CSVField } from '@/lib/smartCSVConverter';
import { SmartSAMService, ChatMessage } from '@/lib/smartSAMService';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInDays, parseISO, isValid, parse as parseDateFns } from 'date-fns';

const defaultCategories = ["Pantry", "Produce", "Dairy", "Meat", "Seafood", "Frozen", "Beverages", "Spices", "Other"];
const CSV_TEMPLATE_HEADERS = "Name,Quantity,Unit,Category,LowStockThreshold,ExpiryDate (YYYY-MM-DD),ImageURL,SmartSuggestions";
const CSV_TEMPLATE_EXAMPLE_ROW = "Example Tomato,10,kg,Produce,2,2024-12-31,https://placehold.co/60x60.png,fresh tomato";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 🔢 Helper function to format numbers cleanly
  const formatNumber = (value: number | string): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    // Remove unnecessary decimals (5.00 -> 5, but keep 5.50 -> 5.5)
    return num % 1 === 0 ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
  };

  // 🎤 Voice Search States
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [isRealTimeListening, setIsRealTimeListening] = useState(false);
  const [showTranscriptBar, setShowTranscriptBar] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // 🤖 Smart SAM Chatbot States
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(SmartSAMService.getWelcomeMessages());
  const [currentMessage, setCurrentMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasNewSuggestion, setHasNewSuggestion] = useState(true);
  
  // 🎤 Smart SAM Voice Assistant States
  const [isSamListening, setIsSamListening] = useState(false);
  const [samVoiceSupported, setSamVoiceSupported] = useState(false);
  const [samRecognition, setSamRecognition] = useState<any>(null);
  const [samLiveTranscript, setSamLiveTranscript] = useState('');
  const [samAudioLevel, setSamAudioLevel] = useState(0);
  const [showSamTranscript, setShowSamTranscript] = useState(false);
  
  // 🔔 Unified Notification System
  const [showUnifiedNotifications, setShowUnifiedNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 🎓 Auto-hide "New to inventory" section
  const [showNewUserGuide, setShowNewUserGuide] = useState(true);
  
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editFormState, setEditFormState] = useState<Partial<InventoryItem>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addFormState, setAddFormState] = useState<Partial<InventoryItem>>({
    name: '',
    quantity: 0,
    unit: '',
    category: 'Pantry',
    lowStockThreshold: 5,
    expiryDate: '',
    image: '',
    aiHint: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🧠 Smart CSV Converter States
  const [csvAnalysis, setCsvAnalysis] = useState<CSVAnalysis | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [isConverting, setIsConverting] = useState(false);

  // Auto-hide new user guide after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNewUserGuide(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const loadInventoryAndNotify = useCallback((showToasts = true) => {
    if (!currentUser) {
      setIsLoading(false);
      setInventory([]);
      return;
    }
    setIsLoading(true);
      const currentInventory = getInventory(currentUser.id);
      setInventory(currentInventory);
      setIsLoading(false);

      if (showToasts) {
        currentInventory.forEach(item => {
          const stockStatus = getStockLevel(item);
          if (stockStatus === 'critical') {
            toast({
              title: `Critical Stock Alert: ${item.name}`,
              description: `Only ${item.quantity} ${item.unit} left. This is below the critical threshold.`,
              variant: "destructive",
            });
          }

          if (item.expiryDate) {
            const expiry = parseISO(item.expiryDate);
            if (isValid(expiry)) {
              const daysUntilExpiry = differenceInDays(expiry, new Date());
              if (daysUntilExpiry <= 0) {
                toast({
                  title: `Expired Item: ${item.name}`,
                  description: `This item expired on ${format(expiry, "PPP")}. Remove or check immediately.`,
                  variant: "destructive",
                });
              } else if (daysUntilExpiry <= 3) {
                toast({
                  title: `Expiry Alert: ${item.name}`,
                  description: `Expires in ${daysUntilExpiry} day(s) on ${format(expiry, "PPP")}.`,
                  variant: "destructive",
                  action: <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
                });
              }
            }
          }
        });
      }
  }, [currentUser, toast]);

  useEffect(() => {
    loadInventoryAndNotify();
  }, [loadInventoryAndNotify]);

  // I'll continue with the rest of the file in the next message due to length constraints...
  
  return <div>Loading full functionality...</div>;
}
