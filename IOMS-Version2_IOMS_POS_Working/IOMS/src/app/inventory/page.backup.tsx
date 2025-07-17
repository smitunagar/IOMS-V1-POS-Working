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

  // 🧠 NEW: Smart CSV Converter States
  const [csvAnalysis, setCsvAnalysis] = useState<CSVAnalysis | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [csvContent, setCsvContent] = useState<string>('');
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [isConverting, setIsConverting] = useState(false);

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

  // 🎤 Initialize Voice Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        console.log('🎤 Speech Recognition supported');
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;
        
        recognition.onstart = () => {
          console.log('🎤 Voice recognition started');
          setIsListening(true);
          setIsProcessingVoice(false);
          setVoiceError('');
          setVoiceTranscript('');
          toast({
            title: "🎤 Listening...",
            description: "Speak now! Say something like 'search for chicken' or 'find tomatoes'",
            duration: 5000
          });
        };
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          let maxConfidence = 0;
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence || 0;
            
            if (confidence > maxConfidence) {
              maxConfidence = confidence;
            }
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          console.log('🎤 Real-time voice:', { 
            finalTranscript, 
            interimTranscript, 
            confidence: maxConfidence 
          });
          
          // Update live transcript for real-time display
          setLiveTranscript(interimTranscript);
          setConfidenceScore(maxConfidence);
          
          if (finalTranscript) {
            setFinalTranscript(finalTranscript);
            setVoiceTranscript(finalTranscript);
            setSearchTerm(finalTranscript);
            setIsProcessingVoice(true);
            setLiveTranscript(''); // Clear live transcript when final
            
            toast({
              title: "🎤 Voice Search Complete",
              description: `Searching for: "${finalTranscript}" (Confidence: ${Math.round(maxConfidence * 100)}%)`,
              duration: 3000
            });
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('🎤 Speech recognition error:', event.error);
          setIsListening(false);
          setIsProcessingVoice(false);
          setVoiceError(event.error);
          
          let errorMessage = "Voice recognition failed. ";
          switch (event.error) {
            case 'no-speech':
              errorMessage = "No speech detected. Please try again and speak clearly.";
              break;
            case 'audio-capture':
              errorMessage = "Microphone not available. Please check your microphone.";
              break;
            case 'not-allowed':
              errorMessage = "Microphone permission denied. Please allow microphone access.";
              break;
            case 'network':
              errorMessage = "Network error. Please check your connection.";
              break;
            default:
              errorMessage = `Speech recognition error: ${event.error}`;
          }
          
          toast({
            title: "🎤 Voice Search Error",
            description: errorMessage,
            variant: "destructive"
          });
        };
        
        recognition.onend = () => {
          console.log('🎤 Voice recognition ended');
          setIsListening(false);
          setTimeout(() => {
            setIsProcessingVoice(false);
            setVoiceTranscript('');
          }, 1000);
        };
        
        setSpeechRecognition(recognition);
        setVoiceSupported(true);
      } else {
        console.log('🎤 Speech Recognition not supported');
        setVoiceSupported(false);
        toast({
          title: "🎤 Voice Search Unavailable",
          description: "Voice search is not supported in this browser. Try Chrome or Edge.",
          variant: "destructive"
        });
      }
    }
  }, [toast]);

  // 🎤 Voice Search Functions
  const startVoiceSearch = async () => {
    if (!voiceSupported) {
      toast({
        title: "🎤 Voice Search Unavailable",
        description: "Voice search is not supported in this browser. Try Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }

    if (speechRecognition && !isListening) {
      try {
        console.log('🎤 Starting voice search...');
        
        // Request microphone permission first
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        speechRecognition.start();
      } catch (error) {
        console.error('🎤 Failed to start voice search:', error);
        toast({
          title: "🎤 Microphone Access Required",
          description: "Please allow microphone access to use voice search.",
          variant: "destructive"
        });
      }
    }
  };

  const stopVoiceSearch = () => {
    if (speechRecognition && isListening) {
      console.log('🎤 Stopping voice search...');
      speechRecognition.stop();
    }
  };

  // 🔍 Simple Voice Test Function
  const testVoiceRecognition = () => {
    console.log('🔍 Testing voice recognition directly...');
    setShowTranscriptBar(true);
    
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      
      if (!SpeechRecognition) {
        alert('❌ Speech Recognition not supported');
        return;
      }
      
      const recognition = new SpeechRecognition();
      
      recognition.onstart = () => {
        console.log('✅ Voice test started');
        setLiveTranscript('🎤 Test listening active... Speak now!');
        toast({
          title: "✅ Voice Test Started",
          description: "Speak now to test voice recognition...",
          duration: 3000
        });
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('📝 Voice test result:', transcript);
        setFinalTranscript(transcript);
        setLiveTranscript('');
        
        toast({
          title: "✅ Voice Test Success",
          description: `Voice recognized: "${transcript}"`,
          duration: 5000
        });
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          setShowTranscriptBar(false);
          setFinalTranscript('');
        }, 10000);
      };
      
      recognition.onerror = (event: any) => {
        console.error('❌ Voice test error:', event.error);
        setLiveTranscript('');
        setFinalTranscript(`❌ Error: ${event.error}`);
        
        toast({
          title: "❌ Voice Test Error",
          description: `Error: ${event.error}`,
          variant: "destructive",
          duration: 5000
        });
        
        // Auto-dismiss after 8 seconds
        setTimeout(() => {
          setShowTranscriptBar(false);
          setFinalTranscript('');
        }, 8000);
      };
      
      recognition.onend = () => {
        console.log('🛑 Voice test ended');
        setLiveTranscript('');
      };
      
      recognition.start();
      
    } catch (error) {
      console.error('💥 Voice test exception:', error);
      setFinalTranscript(`💥 Exception: ${error}`);
      setShowTranscriptBar(true);
      
      toast({
        title: "💥 Voice Test Exception",
        description: `Exception: ${error}`,
        variant: "destructive",
        duration: 5000
      });
      
      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        setShowTranscriptBar(false);
        setFinalTranscript('');
      }, 8000);
    }
  };

  // 🎤 Real-Time Continuous Voice Listening
  const startRealTimeListening = async () => {
    console.log('🎤 Starting real-time voice listening...');
    
    if (!voiceSupported) {
      toast({
        title: "🎤 Voice Not Supported",
        description: "Voice recognition is not supported in this browser. Try Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }

    // First, explicitly request microphone permission
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        console.log('🎤 Requesting microphone permission...');
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('✅ Microphone permission granted');
        
        toast({
          title: "✅ Microphone Access Granted",
          description: "Starting real-time voice recognition...",
          duration: 2000
        });
      }
    } catch (permissionError) {
      console.error('❌ Microphone permission denied:', permissionError);
      toast({
        title: "🎤 Microphone Permission Required",
        description: "Please allow microphone access in your browser settings and try again. Look for the microphone icon in the address bar.",
        variant: "destructive",
        duration: 8000
      });
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      setIsRealTimeListening(true);
      setShowTranscriptBar(true);
      setLiveTranscript('');
      setFinalTranscript('');
      setVoiceError('');
      setAudioLevel(0);
      
      recognition.onstart = () => {
        console.log('🎤 Real-time listening started');
        
        // Simulate audio levels
        const audioLevelInterval = setInterval(() => {
          if (isRealTimeListening) {
            setAudioLevel(Math.random() * 100);
          } else {
            clearInterval(audioLevelInterval);
            setAudioLevel(0);
          }
        }, 100);
        
        toast({
          title: "🎤 Real-Time Listening Active",
          description: "I'm continuously listening... Speak naturally!",
          duration: 3000
        });
      };
      
      recognition.onresult = (event: any) => {
        console.log('🎤 onresult triggered, event:', event);
        let interimText = '';
        let finalText = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence || 0;
          
          console.log(`🎤 Result ${i}: "${transcript}" (isFinal: ${event.results[i].isFinal}, confidence: ${confidence})`);
          
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }
        
        // Update states with more debugging
        console.log('🎤 Setting liveTranscript:', interimText);
        console.log('🎤 Current finalTranscript:', finalTranscript);
        
        setLiveTranscript(interimText);
        setConfidenceScore(event.results[0]?.[0]?.confidence || 0);
        
        if (finalText.trim()) {
          console.log('🎤 Adding final text:', finalText.trim());
          setFinalTranscript(prev => {
            const newFinal = prev + finalText;
            console.log('🎤 New final transcript:', newFinal);
            return newFinal;
          });
          
          // Clear live transcript when we have final text
          setLiveTranscript('');
          
          // Auto-search when user pauses
          if (finalText.toLowerCase().includes('search') || 
              finalText.toLowerCase().includes('find') ||
              finalText.toLowerCase().includes('show')) {
            setSearchTerm(finalText.trim());
            toast({
              title: "🔍 Auto Search",
              description: `Searching for: "${finalText.trim()}"`,
              duration: 2000
            });
          }
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('🎤 Real-time voice error:', event.error);
        setVoiceError(event.error);
        
        let errorMessage = '';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please click the microphone icon in your browser address bar and select "Allow". Then refresh and try again.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please speak closer to your microphone.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not found. Please check your microphone connection.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          default:
            errorMessage = `Voice error: ${event.error}. Try refreshing the page.`;
        }
        
        if (event.error !== 'no-speech') {
          setIsRealTimeListening(false);
          toast({
            title: "🎤 Voice Error",
            description: errorMessage,
            variant: "destructive",
            duration: 10000
          });
        }
      };
      
      recognition.onend = () => {
        console.log('🎤 Real-time listening ended');
        if (isRealTimeListening) {
          // Restart if still supposed to be listening
          setTimeout(() => {
            if (isRealTimeListening) {
              recognition.start();
            }
          }, 100);
        }
      };
      
      recognition.start();
      
    } catch (error) {
      console.error('💥 Real-time listening error:', error);
      setIsRealTimeListening(false);
      toast({
        title: "🎤 Voice Setup Error",
        description: `Failed to start real-time listening: ${error}`,
        variant: "destructive"
      });
    }
  };

  const stopRealTimeListening = () => {
    console.log('🛑 Stopping real-time listening...');
    setIsRealTimeListening(false);
    
    // Keep transcripts visible but stop listening
    // setLiveTranscript(''); // Don't clear immediately
    // setFinalTranscript(''); // Don't clear immediately
    
    if (speechRecognition) {
      speechRecognition.stop();
    }
    
    toast({
      title: "🛑 Real-Time Listening Stopped",
      description: "Voice recognition has been deactivated. Transcript preserved.",
      duration: 2000
    });
  };

  const clearTranscripts = () => {
    console.log('🧹 Clearing all transcripts...');
    setLiveTranscript('');
    setFinalTranscript('');
    setVoiceTranscript('');
    setConfidenceScore(0);
    setShowTranscriptBar(false);
    setAudioLevel(0);
    
    toast({
      title: "🧹 Transcripts Cleared",
      description: "All voice transcripts have been cleared.",
      duration: 1500
    });
  };

  // 🤖 Smart SAM Chatbot Functions
  const sendMessageToSAM = () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      message: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    
    // Generate SAM's response
    setTimeout(() => {
      const samResponse = generateSAMResponse(currentMessage);
      const samMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sam' as const,
        message: samResponse,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, samMessage]);
    }, 1000);

    setCurrentMessage('');
  };

  const generateSAMResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    
    // Storage and temperature questions
    if (msg.includes('storage') || msg.includes('store') || msg.includes('temperature') || msg.includes('temp')) {
      if (msg.includes('meat') || msg.includes('chicken') || msg.includes('beef') || msg.includes('fish')) {
        return "🥩 For meat & seafood: Store at 32°F (0°C) or below. Keep on bottom shelf to prevent dripping. Use FIFO rotation and check dates daily. Fresh meat should be used within 1-3 days.";
      } else if (msg.includes('dairy') || msg.includes('milk') || msg.includes('cheese')) {
        return "🥛 For dairy products: Maintain 32-40°F (0-4°C). Store milk on middle/bottom shelves (door is too warm). Check expiry dates regularly. Hard cheeses last longer than soft ones.";
      } else if (msg.includes('vegetable') || msg.includes('fruit')) {
        return "🥬 For fresh produce: Most vegetables need refrigeration (32-40°F). Some fruits ripen better at room temp first. Keep ethylene producers (bananas, apples) separate. Check daily for spoilage.";
      } else {
        return "🌡️ Storage depends on the food type! Refrigerated items: 32-40°F, Frozen: 0°F (-18°C), Pantry: cool & dry. What specific item do you need storage info for?";
      }
    }
    
    // Expiry and shelf life questions
    if (msg.includes('expiry') || msg.includes('expire') || msg.includes('shelf life') || msg.includes('fresh')) {
      return "📅 I predict expiry dates automatically! Fresh meat: 1-3 days, Dairy: 5-7 days, Fresh produce: 3-7 days, Frozen items: 3-6 months. Always check for signs of spoilage regardless of dates.";
    }
    
    // Inventory management questions
    if (msg.includes('add item') || msg.includes('new item') || msg.includes('add inventory')) {
      return "➕ To add items: Click 'Add New Item' button, fill in details (I'll auto-suggest categories!), or upload a CSV file and I'll intelligently process it. Want me to guide you through it?";
    }
    
    if (msg.includes('csv') || msg.includes('upload') || msg.includes('import')) {
      return "📊 For CSV upload: Click 'Upload CSV', select your file (any format works!), I'll analyze and map fields automatically. I can detect categories, standardize units, and predict expiry dates. Try it!";
    }
    
    // Categories questions
    if (msg.includes('categor') || msg.includes('type') || msg.includes('classify')) {
      return "🏷️ I use 11 professional categories: Fresh Vegetables, Fresh Fruits, Meat & Seafood, Plant Proteins, Dairy, Grains & Cereals, Cooking Oils, Herbs & Spices, Frozen Foods, Beverages, and Baking Essentials. I auto-detect these when you add items!";
    }
    
    // Stock management
    if (msg.includes('stock') || msg.includes('quantity') || msg.includes('alert') || msg.includes('low')) {
      return "📊 Stock management: Set low stock thresholds for each item. I'll show color-coded alerts: 🔴 Red = critical/expired, 🟡 Yellow = low stock/expiring soon, 🟢 Green = all good. Check the progress bars for stock levels!";
    }
    
    // Search and navigation
    if (msg.includes('search') || msg.includes('find')) {
      return "🔍 To search: Use the search bar (supports voice search with the mic button!), filter by categories, or look for color-coded alerts. You can search by item name or category. Try saying 'search for tomatoes'!";
    }
    
    // Voice commands
    if (msg.includes('voice') || msg.includes('mic') || msg.includes('speak')) {
      return "🎤 Voice search: Click the microphone icon next to the search bar and speak your search term. I'll automatically search for what you say. Works great for hands-free searching while cooking!";
    }
    
    // FIFO and rotation
    if (msg.includes('fifo') || msg.includes('rotation') || msg.includes('first in')) {
      return "🔄 FIFO (First In, First Out): Always use older items first! I sort by expiry dates and show alerts. For perishables like meat and dairy, this prevents waste and ensures food safety.";
    }
    
    // Food safety
    if (msg.includes('safe') || msg.includes('spoil') || msg.includes('bad')) {
      return "🛡️ Food safety tips: Check temperatures regularly, follow FIFO rotation, watch for spoilage signs (smell, texture, color), and trust your senses. When in doubt, throw it out! I help track all this automatically.";
    }
    
    // Units and measurements
    if (msg.includes('unit') || msg.includes('measure') || msg.includes('convert')) {
      return "📏 I standardize units automatically! I convert to: kg (weight), liters (volume), pieces (count). When you upload CSV, I'll detect and convert different units like lbs→kg, ml→l, etc.";
    }
    
    // Getting started
    if (msg.includes('help') || msg.includes('start') || msg.includes('how') || msg.includes('tutorial')) {
      return "🎓 Getting started: 1) Add items manually or upload CSV, 2) I'll categorize and set storage recommendations, 3) Monitor color-coded alerts, 4) Use tooltips (hover over items) for detailed info. What specifically would you like help with?";
    }
    
    // Greetings
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return "👋 Hello! I'm Smart SAM, your IOMS assistant! I can help with inventory management, storage guidelines, expiry tracking, CSV imports, food categorization, stock alerts, and best practices. What can I help you with today?";
    }
    
    // Default response
    return "🤖 I'm here to help with your IOMS system! I can assist with storage temperatures, expiry dates, inventory management, CSV uploads, food categorization, stock alerts, and best practices. Could you be more specific about what you need help with?";
  };

  const handleRefresh = () => {
    loadInventoryAndNotify(false);
  };

  const handleAddNewItem = () => {
    setIsAddDialogOpen(true);
    setAddFormState({
      name: '',
      quantity: 0,
      unit: '',
      category: 'Pantry',
      lowStockThreshold: 5,
      expiryDate: '',
      image: '',
      aiHint: ''
    });
  };

  const handleAddSubmit = () => {
    if (!currentUser) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
      return;
    }

    if (!addFormState.name || !addFormState.unit || addFormState.quantity === undefined || addFormState.quantity < 0) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    try {
      const newItem = addInventoryItem(currentUser.id, {
        name: addFormState.name,
        quantity: addFormState.quantity || 0,
        unit: addFormState.unit,
        category: addFormState.category || 'Pantry',
        lowStockThreshold: addFormState.lowStockThreshold || 5,
        expiryDate: addFormState.expiryDate,
        image: addFormState.image,
        aiHint: addFormState.aiHint
      });

      if (newItem) {
        toast({ title: "Success", description: `Added "${newItem.name}" to inventory.` });
        loadInventoryAndNotify(false);
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to add item.", 
        variant: "destructive" 
      });
    }
  };

  const handleClearInventory = () => {
    if (!currentUser) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
      return;
    }
    
    if (confirm(`⚠️ WARNING: This will permanently delete ALL inventory items for your account.\n\nThis action cannot be undone. Are you absolutely sure you want to clear the entire inventory?`)) {
      const success = clearAllInventory(currentUser.id);
      if (success) {
        toast({ 
          title: "Inventory Cleared", 
          description: "All inventory items have been permanently deleted.",
          variant: "destructive" 
        });
        loadInventoryAndNotify(false);
      } else {
        toast({ 
          title: "Error", 
          description: "Failed to clear inventory. Please try again.", 
          variant: "destructive" 
        });
      }
    }
  };

  const handleOpenEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setEditFormState({ ...item }); 
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!currentUser || !editingItem || !editFormState) return;

    const quantity = parseFloat(String(editFormState.quantity));
    const lowStockThreshold = parseFloat(String(editFormState.lowStockThreshold));
    const quantityUsed = parseFloat(String(editFormState.quantityUsed || 0));

    if (isNaN(quantity) || isNaN(lowStockThreshold) || isNaN(quantityUsed)) {
        toast({ title: "Error", description: "Quantity, threshold, and used quantity must be valid numbers.", variant: "destructive" });
        return;
    }
    
    const updatedDetails: Partial<InventoryItem> = {
      ...editFormState,
      quantity,
      lowStockThreshold,
      quantityUsed,
      aiHint: editFormState.aiHint || undefined,
      expiryDate: editFormState.expiryDate ? editFormState.expiryDate : undefined,
    };
    
    const result = updateInventoryItem(currentUser.id, editingItem.id, updatedDetails);
    if (result) {
      toast({ title: "Success", description: `${result.name} updated successfully.` });
      loadInventoryAndNotify(false); 
    } else {
      toast({ title: "Error", description: "Failed to update item.", variant: "destructive" });
    }
    setIsEditDialogOpen(false);
    setEditingItem(null);
  };
  
  const handleDeleteItem = (itemId: string, itemName: string) => {
    if (!currentUser) return;
    if (confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      const success = removeInventoryItem(currentUser.id, itemId);
      if (success) {
        toast({ title: "Item Deleted", description: `"${itemName}" has been removed from inventory.` });
        loadInventoryAndNotify(false);
      } else {
        toast({ title: "Error", description: `Failed to delete "${itemName}".`, variant: "destructive" });
      }
    }
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "number" || name === "quantity" || name === "lowStockThreshold" || name === "quantityUsed") {
      const numValue = parseFloat(value);
      setEditFormState(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setEditFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    setEditFormState(prev => ({ ...prev, expiryDate: date ? date.toISOString().split('T')[0] : undefined }));
  };

  const handleDownloadTemplate = () => {
    const csvContent = `${CSV_TEMPLATE_HEADERS}\n${CSV_TEMPLATE_EXAMPLE_ROW}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "inventory_template.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast({title: "Template Downloading", description: "inventory_template.csv should start downloading."})
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) {
        toast({ title: "Error", description: "Please log in to import inventory.", variant: "destructive" });
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
      
      // 🧠 SMART CSV ANALYSIS
      try {
        console.log('🧠 Starting smart CSV analysis...');
        const analysis = analyzeCSV(text, 'inventory');
        
        if (analysis.confidence < 0.3) {
          toast({ 
            title: "🤔 CSV Format Not Recognized", 
            description: "I'll help you map the fields manually. Please check the mapping dialog.", 
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "🧠 Smart CSV Analysis Complete", 
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
        setFieldMappings(initialMappings);
        
        setShowMappingDialog(true);
        
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

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockLevel = (item: InventoryItem): "critical" | "low" | "medium" | "high" => {
    const effectiveThreshold = item.lowStockThreshold > 0 ? item.lowStockThreshold : 1;
    if (item.quantity <= 0) return "critical"; 
    if (item.quantity <= effectiveThreshold / 2 && effectiveThreshold > 1) return "critical"; 
    if (item.quantity <= effectiveThreshold) return "low";
    if (item.quantity <= effectiveThreshold * 2) return "medium";
    return "high";
  }
  
  const calculateProgressValue = (item: InventoryItem) => {
    const effectiveThreshold = item.lowStockThreshold > 0 ? item.lowStockThreshold : 1;
    const maxStockGuess = Math.max(item.quantity + (item.quantityUsed || 0), effectiveThreshold * 5, 1);
    if (maxStockGuess === 0 && item.quantity === 0) return 0;
    if (maxStockGuess === 0 && item.quantity > 0) return 100; 
    return (item.quantity / maxStockGuess) * 100;
  }

  const getExpiryStatus = (expiryDateStr?: string): { status: "expired" | "soon" | "ok" | "none"; days?: number; formattedDate?: string } => {
    if (!expiryDateStr) return { status: "none" };
    const expiry = parseISO(expiryDateStr);
    if (!isValid(expiry)) return { status: "none" };
    
    const days = differenceInDays(expiry, new Date());
    const formatted = format(expiry, "PP");

    if (days < 0) return { status: "expired", days, formattedDate: formatted };
    if (days <= 7) return { status: "soon", days, formattedDate: formatted };
    return { status: "ok", days, formattedDate: formatted };
  };


  // 🧠 SMART CSV CONVERTER FUNCTIONS
  const handleConfirmMapping = async () => {
    if (!csvAnalysis || !csvContent || !currentUser) return;
    
    setIsConverting(true);
    try {
      console.log('🔄 Converting CSV with mappings:', fieldMappings);
      
      const conversionResult = convertCSV(csvContent, fieldMappings, 'inventory');
      
      if (!conversionResult.success) {
        throw new Error('Conversion failed');
      }
      
      // Convert to system format and import
      const itemsToProcess: ProcessedCSVItem[] = conversionResult.convertedData.map(item => ({
        name: item.Name || 'Unknown Item',
        quantity: parseFloat(item.Quantity) || 0,
        unit: item.Unit || 'pcs',
        category: item.Category || 'General',
        lowStockThreshold: parseFloat(item.LowStockThreshold) || 10,
        expiryDate: item['ExpiryDate (YYYY-MM-DD)'] || undefined,
        imageURL: item.ImageURL || undefined,
        aiHint: item.SmartSuggestions || undefined
      }));
      
      // Import the converted data
      const result = batchAddOrUpdateInventoryItems(currentUser.id, itemsToProcess);
      
      // Show results with intelligence summary
      const totalIntelligence = Object.values(conversionResult.intelligenceApplied).reduce((a, b) => a + b, 0);
      toast({ 
        title: "🎉 Smart Import Successful!", 
        description: `Imported ${result.added + result.updated} items (${result.added} new, ${result.updated} updated). Applied ${totalIntelligence} smart enhancements!`,
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
      
      // Refresh inventory and close dialogs
      loadInventoryAndNotify(false);
      setShowMappingDialog(false);
      setCsvAnalysis(null);
      setCsvContent('');
      setFieldMappings({});
      
    } catch (error: any) {
      console.error('❌ Smart import failed:', error);
      toast({
        title: "❌ Import Failed",
        description: error.message || "Failed to import CSV. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConverting(false);
    }
  };
  
  const handleMappingChange = (originalField: string, targetField: string) => {
    setFieldMappings(prev => ({
      ...prev,
      [originalField]: targetField
    }));
  };
  
  const downloadSmartTemplate = () => {
    const templateContent = generateTemplateCSV('inventory');
    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'inventory_smart_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast({title: "📥 Smart Template Downloaded", description: "Use this template for guaranteed compatibility!"});
  };

  // 🤖 Smart SAM Voice Functions
  const startSamVoiceListening = async () => {
    console.log('🎤 Starting SAM voice listening...');
    
    if (!samVoiceSupported) {
      toast({
        title: "🎤 Voice Not Supported",
        description: "Voice recognition is not supported in this browser for SAM.",
        variant: "destructive"
      });
      return;
    }

    // Request microphone permission
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } catch (permissionError) {
      console.error('❌ SAM microphone permission denied:', permissionError);
      toast({
        title: "🎤 Microphone Permission Required",
        description: "Please allow microphone access for SAM voice chat.",
        variant: "destructive",
        duration: 8000
      });
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      setIsSamListening(true);
      setShowSamTranscript(true);
      setSamLiveTranscript('');
      setSamAudioLevel(0);
      
      recognition.onstart = () => {
        console.log('🎤 SAM voice recognition started');
        
        // Simulate audio levels for SAM
        const samAudioInterval = setInterval(() => {
          if (isSamListening) {
            setSamAudioLevel(Math.random() * 100);
          } else {
            clearInterval(samAudioInterval);
            setSamAudioLevel(0);
          }
        }, 100);
        
        toast({
          title: "🤖 SAM is Listening",
          description: "Speak to Smart SAM... I'm ready to help!",
          duration: 3000
        });
      };
      
      recognition.onresult = (event: any) => {
        console.log('🎤 SAM onresult triggered:', event);
        let interimText = '';
        let finalText = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }
        
        setSamLiveTranscript(interimText);
        
        if (finalText.trim()) {
          console.log('🎤 SAM final transcript:', finalText);
          setSamLiveTranscript('');
          
          // Create user message with voice indicator
          const userMessage = {
            id: Date.now().toString(),
            type: 'user' as const,
            message: `🎤 ${finalText}`,
            timestamp: new Date()
          };

          setChatMessages(prev => [...prev, userMessage]);
          
          // Generate SAM's response
          setTimeout(() => {
            const samResponse = generateSAMResponse(finalText);
            const samMessage = {
              id: (Date.now() + 1).toString(),
              type: 'sam' as const,
              message: samResponse,
              timestamp: new Date()
            };
            setChatMessages(prev => [...prev, samMessage]);
          }, 1000);
          
          // Auto-dismiss transcript after response
          setTimeout(() => {
            setShowSamTranscript(false);
          }, 5000);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('🎤 SAM voice error:', event.error);
        setIsSamListening(false);
        setSamLiveTranscript('');
        setSamAudioLevel(0);
        
        let errorMessage = '';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Microphone access denied for SAM. Please allow microphone access.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please speak closer to your microphone.';
            break;
          default:
            errorMessage = `SAM voice error: ${event.error}`;
        }
        
        toast({
          title: "🤖 SAM Voice Error",
          description: errorMessage,
          variant: "destructive",
          duration: 5000
        });
      };
      
      recognition.onend = () => {
        console.log('🎤 SAM voice recognition ended');
        setIsSamListening(false);
        setSamAudioLevel(0);
        setTimeout(() => setSamLiveTranscript(''), 1000);
      };
      
      recognition.start();
      setSamRecognition(recognition);
      
    } catch (error) {
      console.error('💥 SAM voice setup error:', error);
      setIsSamListening(false);
      toast({
        title: "🤖 SAM Voice Setup Error",
        description: `Failed to start SAM voice: ${error}`,
        variant: "destructive"
      });
    }
  };

  const stopSamVoiceListening = () => {
    console.log('🛑 Stopping SAM voice listening...');
    setIsSamListening(false);
    setSamLiveTranscript('');
    setSamAudioLevel(0);
    
    if (samRecognition) {
      samRecognition.stop();
    }
    
    toast({
      title: "🛑 SAM Voice Stopped",
      description: "Smart SAM voice recognition has been deactivated.",
      duration: 2000
    });
  };

  // 🤖 Initialize SAM Voice Support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        console.log('🤖 SAM Voice Recognition supported');
        setSamVoiceSupported(true);
      } else {
        console.log('🤖 SAM Voice Recognition not supported');
        setSamVoiceSupported(false);
      }
    }
  }, []);
        setChatMessages(prev => [...prev, userMessage, samMessage]);
        setCurrentMessage('');
        setIsSamListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('🎤 SAM voice error:', event.error);
        setIsSamListening(false);
        
        if (event.error === 'not-allowed') {
          alert('🎤 Microphone access denied. Please allow microphone access and try again.');
        }
      };

      recognition.onend = () => {
        console.log('🎤 SAM voice recognition ended');
        setIsSamListening(false);
      };

      setSamRecognition(recognition);
      console.log('🎤 SAM voice recognition setup complete');
      
    } catch (error) {
      console.error('🎤 Error setting up SAM voice recognition:', error);
      setSamVoiceSupported(false);
    }
  }, []);

  // Simple voice functions
  const startSamVoiceRecognition = () => {
    console.log('🎤 Starting SAM voice recognition...');
    
    if (!samRecognition) {
      console.error('🎤 No recognition object available');
      return;
    }

    if (!samVoiceSupported) {
      alert('🎤 Voice recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      samRecognition.start();
      console.log('🎤 SAM voice recognition started successfully');
    } catch (error) {
      console.error('🎤 Error starting SAM voice recognition:', error);
      setIsSamListening(false);
      
      if (error instanceof Error && error.message.includes('already started')) {
        console.log('🎤 Voice recognition already running, stopping first...');
        samRecognition.stop();
        setTimeout(() => {
          try {
            samRecognition.start();
          } catch (retryError) {
            console.error('🎤 Retry failed:', retryError);
          }
        }, 100);
      }
    }
  };

  const stopSamVoiceRecognition = () => {
    console.log('🎤 Stopping SAM voice recognition...');
    if (samRecognition) {
      samRecognition.stop();
      setIsSamListening(false);
    }
  };

  const extractStorageInfo = (aiHint: string) => {
    if (!aiHint) return { temperature: '', tips: '', recommendations: [], allergens: [] };
    
    const parts = aiHint.split('|').map(part => part.trim());
    const result = {
      temperature: '',
      tips: '',
      recommendations: [] as string[],
      allergens: [] as string[]
    };
    
    parts.forEach(part => {
      if (part.includes('Storage:')) {
        result.temperature = part.replace('Storage:', '').trim();
      } else if (part.includes('Tips:')) {
        result.tips = part.replace('Tips:', '').trim();
      } else if (part.includes('Allergens:')) {
        result.allergens = part.replace('Allergens:', '').split(',').map(a => a.trim());
      } else if (!part.includes('Storage:') && !part.includes('Tips:') && !part.includes('Allergens:')) {
        result.recommendations.push(part);
      }
    });
    
    return result;
  };

  // Function to send message to SAM
  const sendMessageToSAM = () => {
    if (!currentMessage.trim()) return;
    
    const userMessage: ChatMessage = { 
      id: Date.now().toString(),
      type: 'user',
      message: currentMessage,
      timestamp: new Date()
    };
    const botResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'sam',
      message: SmartSAMService.generateResponse(currentMessage),
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage, botResponse]);
    setCurrentMessage('');
  };

  return (
    <TooltipProvider>
      <AppLayout pageTitle="Inventory Management">
      <Card>
        <CardHeader>
          {/* 🎓 USER-FRIENDLY GUIDANCE SECTION */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">🎓</div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">New to Inventory Management? Here's how to get started:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-blue-800 mb-1">📥 Step 1: Add Items</div>
                    <p className="text-blue-700">Click "Add New Item" or upload a CSV file. Our smart system will help categorize and set up storage recommendations automatically.</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-blue-800 mb-1">🏷️ Step 2: Learn Storage</div>
                    <p className="text-blue-700">Hover over item names and categories to see detailed storage instructions, temperature requirements, and helpful tips.</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="font-medium text-blue-800 mb-1">📊 Step 3: Monitor Alerts</div>
                    <p className="text-blue-700">Watch for color-coded alerts: Red = urgent attention needed, Yellow = expiring soon, Green = all good!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Current Stock Levels</CardTitle>
              <CardDescription>View, manage, and get alerts for your inventory. Data is stored locally per user.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleRefresh} disabled={isLoading || !currentUser}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleDownloadTemplate} variant="outline" disabled={!currentUser}>
                <Download className="mr-2 h-4 w-4" /> Download CSV Template
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={!currentUser}>
                <Upload className="mr-2 h-4 w-4" /> Import from CSV
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                className="hidden"
              />
              <Button onClick={handleAddNewItem} disabled={!currentUser}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
              </Button>
              <Button 
                onClick={handleClearInventory} 
                disabled={!currentUser || filteredInventory.length === 0} 
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
              >
                <X className="mr-2 h-4 w-4" /> Clear All
              </Button>
              <Button onClick={handleClearInventory} variant="destructive" disabled={!currentUser}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear Inventory
              </Button>
            </div>
          </div>
          <div className="relative mt-4">
            {/* Voice Recognition Visual Feedback */}
            {isListening && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm px-3 py-1 rounded-t-md z-10 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span>Listening... {voiceTranscript && `"${voiceTranscript}"`}</span>
                </div>
              </div>
            )}
            
            {/* Voice Processing Feedback */}
            {isProcessingVoice && !isListening && (
              <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-sm px-3 py-1 rounded-t-md z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Processing: "{voiceTranscript}"</span>
                </div>
              </div>
            )}
            
            <Input
              type="search"
              placeholder={isListening ? "Listening... Speak now!" : "Search ingredients or categories... (or click mic for voice search)"}
              className={`pr-12 transition-all duration-300 ${isListening ? 'mt-8 border-blue-500 shadow-lg' : ''} ${isProcessingVoice ? 'mt-8 border-green-500' : ''}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={!currentUser}
            />
            
            {voiceSupported && (
              <Button
                variant="ghost"
                size="icon"
                className={`absolute right-1 h-8 w-8 transition-all duration-300 ${
                  isListening 
                    ? 'top-9 text-red-500 bg-red-50 animate-pulse shadow-lg' 
                    : isProcessingVoice 
                    ? 'top-9 text-green-500 bg-green-50' 
                    : 'top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-blue-500'
                }`}
                onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                disabled={!currentUser}
                title={isListening ? 'Stop voice search (Click to stop)' : 'Start voice search (Click to speak)'}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : isProcessingVoice ? (
                  <div className="h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
            
            {/* Voice Error Display */}
            {voiceError && (
              <div className="absolute top-full left-0 right-0 bg-red-100 border border-red-300 text-red-700 text-xs px-3 py-2 rounded-b-md">
                Voice error: {voiceError}. Please try again.
              </div>
            )}
            
            {/* Voice Instructions */}
            {isListening && (
              <div className="absolute top-full left-0 right-0 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-2 rounded-b-md">
                💡 Try saying: "search for chicken", "find tomatoes", "show dairy products", or any item name
              </div>
            )}
            
            {/* Real-Time Voice Transcript Display */}
            {(showTranscriptBar || isRealTimeListening || liveTranscript || finalTranscript) && (
              <div className="absolute top-full left-0 right-0 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 text-purple-800 text-sm px-4 py-3 rounded-b-md shadow-lg z-20">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    {/* Show listening status when real-time is active */}
                    {isRealTimeListening && !liveTranscript && !finalTranscript && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-red-600">Status:</span>
                        </div>
                        <span className="text-red-700 font-medium">🎤 Real-time listening active... Speak now!</span>
                        {/* Audio Level Visualization */}
                        <div className="flex items-center gap-1 ml-2">
                          <div className="flex items-end gap-px h-4">
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-1 bg-gradient-to-t from-green-400 to-green-600 rounded-sm transition-all duration-100 ${
                                  audioLevel > i * 10 ? 'opacity-100' : 'opacity-20'
                                }`}
                                style={{ height: `${Math.max(2, (i + 1) * 2)}px` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Live transcript (what you're currently saying) */}
                    {liveTranscript && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-purple-600">Live:</span>
                        </div>
                        <span className="text-purple-700 italic">"{liveTranscript}"</span>
                        {confidenceScore > 0 && (
                          <span className="text-xs text-purple-500">
                            ({Math.round(confidenceScore * 100)}% confidence)
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Final transcript (confirmed speech) */}
                    {finalTranscript && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs font-medium text-green-600">Final:</span>
                        </div>
                        <span className="text-green-700 font-medium">"{finalTranscript}"</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setShowTranscriptBar(false);
                      if (!isRealTimeListening) {
                        setLiveTranscript('');
                        setFinalTranscript('');
                      }
                    }}
                    className="ml-2 p-1 hover:bg-purple-100 rounded text-purple-600 hover:text-purple-800 transition-colors"
                    title="Close transcript display"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Enhanced Voice Control Panel */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      console.log('🎤 Testing microphone permission...');
                      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                      stream.getTracks().forEach(track => track.stop()); // Stop the stream
                      alert('✅ Microphone permission granted! Voice features should work now.');
                    } catch (error: any) {
                      console.error('❌ Microphone permission error:', error);
                      if (error.name === 'NotAllowedError') {
                        alert('❌ Microphone access denied. Please:\n1. Click the microphone icon in your browser address bar\n2. Select "Allow"\n3. Refresh the page and try again');
                      } else {
                        alert(`❌ Microphone error: ${error.message}`);
                      }
                    }
                  }}
                  className="text-xs"
                >
                  🎤 Test Microphone Permission
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('🔍 VOICE DIAGNOSTIC:');
                    console.log('🌐 User Agent:', navigator.userAgent);
                    console.log('🎯 webkitSpeechRecognition:', 'webkitSpeechRecognition' in window);
                    console.log('🎯 SpeechRecognition:', 'SpeechRecognition' in window);
                    console.log('🎯 voiceSupported:', voiceSupported);
                    console.log('🎯 speechRecognition object:', speechRecognition);
                    console.log('🎯 isListening:', isListening);
                    console.log('🎯 voiceError:', voiceError);
                    console.log('🎯 Current URL:', window.location.href);
                    console.log('🎯 HTTPS:', window.location.protocol === 'https:');
                    
                    // Try to create a new recognition instance
                    try {
                      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
                      if (SpeechRecognition) {
                        const test = new SpeechRecognition();
                        console.log('✅ Successfully created SpeechRecognition instance:', test);
                        alert('✅ Voice recognition is available! Check console for details.');
                      } else {
                        console.log('❌ SpeechRecognition not available');
                        alert('❌ Voice recognition not available in this browser');
                      }
                    } catch (error) {
                      console.error('💥 Error creating SpeechRecognition:', error);
                      alert(`💥 Error: ${error}`);
                    }
                  }}
                  className="text-xs"
                >
                  🔍 Test Voice Recognition
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testVoiceRecognition}
                  className="text-xs"
                >
                  🎤 Direct Voice Test
                </Button>
                
                <Button
                  variant={isRealTimeListening ? "destructive" : "default"}
                  size="sm"
                  onClick={isRealTimeListening ? stopRealTimeListening : startRealTimeListening}
                  className="text-xs"
                  disabled={!voiceSupported}
                >
                  {isRealTimeListening ? (
                    <>
                      <MicOff className="w-3 h-3 mr-1" />
                      Stop Real-Time
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3 mr-1" />
                      Start Real-Time Voice
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearTranscripts}
                  className="text-xs"
                  disabled={!liveTranscript && !finalTranscript}
                >
                  🧹 Clear Transcripts
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground flex items-center gap-4">
                {isRealTimeListening && (
                  <span className="text-green-600 font-medium animate-pulse">🔴 Real-time listening active</span>
                )}
                {(liveTranscript || finalTranscript) && (
                  <span className="text-blue-600">📝 Transcript available</span>
                )}
                {voiceError && (
                  <span className="text-red-600">❌ Error: {voiceError}</span>
                )}
                {!voiceSupported && (
                  <span className="text-orange-600">⚠️ Voice not supported</span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && currentUser ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading inventory...</p>
            </div>
          ) : !currentUser ? (
             <p className="text-center text-muted-foreground py-8">Please log in to view inventory.</p>
          ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableCaption>A list of your current inventory items. Last updated: {new Date().toLocaleTimeString()}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead className="min-w-[150px]">Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Last Restocked</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => {
                const stockStatus = getStockLevel(item);
                const expiryInfo = getExpiryStatus(item.expiryDate);
                
                let rowClass = "";
                if (stockStatus === 'critical' || expiryInfo.status === 'expired') rowClass = 'bg-destructive/20 hover:bg-destructive/30';
                else if (stockStatus === 'low' || expiryInfo.status === 'soon') rowClass = 'bg-yellow-400/20 hover:bg-yellow-400/30';

                return (
                  <TableRow key={item.id} className={rowClass}>
                    <TableCell>
                      <Image
                        src={item.image || "https://placehold.co/60x60.png"}
                        alt={item.name}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                        data-ai-hint={item.aiHint || item.name.toLowerCase().split(' ').slice(0,2).join(' ')}
                        onError={(e) => (e.currentTarget.src = "https://placehold.co/60x60.png")}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            {item.name}
                            {item.aiHint && (
                              <div className="text-xs text-muted-foreground mt-1">
                                💡 {extractStorageInfo(item.aiHint).temperature || 'Storage info available'}
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-4" side="right">
                          <div className="space-y-2">
                            <div className="font-semibold text-sm">{item.name} - Storage Guide</div>
                            {(() => {
                              const storageInfo = extractStorageInfo(item.aiHint || '');
                              return (
                                <>
                                  {storageInfo.temperature && (
                                    <div className="text-xs">
                                      <span className="font-medium">🌡️ Temperature:</span> {storageInfo.temperature}
                                    </div>
                                  )}
                                  {storageInfo.tips && (
                                    <div className="text-xs">
                                      <span className="font-medium">💡 Storage Tips:</span> {storageInfo.tips}
                                    </div>
                                  )}
                                  {storageInfo.recommendations && storageInfo.recommendations.length > 0 && (
                                    <div className="text-xs">
                                      <span className="font-medium">📋 Recommendations:</span>
                                      <ul className="list-disc list-inside ml-2 mt-1">
                                        {storageInfo.recommendations.map((rec, idx) => (
                                          <li key={idx}>{rec}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {storageInfo.allergens && storageInfo.allergens.length > 0 && (
                                    <div className="text-xs">
                                      <span className="font-medium">⚠️ Allergens:</span> {storageInfo.allergens.join(', ')}
                                    </div>
                                  )}
                                  <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                                    <span className="font-medium">📦 Category:</span> {item.category}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="cursor-help">
                            {item.category}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-3" side="top">
                          <div className="space-y-1">
                            <div className="font-semibold text-sm">📂 {item.category} Category</div>
                            <div className="text-xs text-muted-foreground">
                              {(() => {
                                switch (item.category) {
                                  case 'Fresh Vegetables':
                                    return 'Store in refrigerated conditions. Check daily for freshness. Use FIFO rotation.';
                                  case 'Fresh Fruits': 
                                    return 'Some fruits ripen faster at room temp, others need refrigeration. Separate ethylene producers.';
                                  case 'Meat & Seafood':
                                    return 'Keep at 32°F or below. Use FIFO rotation. Store on bottom shelf to prevent dripping.';
                                  case 'Plant Proteins':
                                    return 'Store in cool, dry place. Keep legumes and nuts in airtight containers.';
                                  case 'Dairy':
                                    return 'Maintain 32-40°F. Check expiry dates regularly. Store milk on middle/bottom shelves.';
                                  case 'Grains & Cereals':
                                    return 'Store in cool, dry place. Use airtight containers to prevent pests.';
                                  case 'Cooking Oils':
                                    return 'Keep away from heat and light. Some oils need refrigeration after opening.';
                                  case 'Herbs & Spices':
                                    return 'Store in cool, dry place away from light. Label with purchase dates.';
                                  case 'Frozen Foods':
                                    return 'Maintain 0°F (-18°C). Follow FIFO rotation. Check for freezer burn.';
                                  case 'Beverages':
                                    return 'Follow individual storage requirements. Some need refrigeration, others room temperature.';
                                  case 'Baking Essentials':
                                    return 'Store in airtight containers. Keep flour and sugar in cool, dry places.';
                                  default:
                                    return 'Follow general storage guidelines for this category.';
                                }
                              })()}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(item.quantity)}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.quantityUsed || 0)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <Progress 
                           value={calculateProgressValue(item)} 
                           className="w-20 h-2 [&>*]:bg-current" 
                           style={{color: stockStatus === 'critical' || stockStatus === 'low' ? 'hsl(var(--destructive))' : stockStatus === 'medium' ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-1))'}}
                         />
                         <Badge 
                           variant={stockStatus === 'critical' ? 'destructive' : stockStatus === 'low' ? 'destructive' : stockStatus === 'medium' ? 'secondary' : 'default'} 
                           className="capitalize"
                          >
                           {stockStatus}
                         </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {expiryInfo.formattedDate ? (
                        <Badge 
                          variant={expiryInfo.status === 'expired' ? 'destructive' : expiryInfo.status === 'soon' ? 'secondary' : 'outline'}
                          className={expiryInfo.status === 'soon' && expiryInfo.days !== undefined && expiryInfo.days <=3 ? 'bg-yellow-500 text-black' : ''}
                        >
                           {expiryInfo.status === 'expired' ? `Expired: ` : expiryInfo.status === 'soon' ? `Expires: ` : ''}
                           {expiryInfo.formattedDate}
                           {expiryInfo.status === 'soon' && expiryInfo.days !== undefined && ` (${expiryInfo.days}d)`}
                        </Badge>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center space-x-1">
                      <Button variant="outline" size="icon" onClick={() => handleOpenEditDialog(item)} title="Edit Item">
                        <Pencil className="h-4 w-4" />
                      </Button>
                       <Button variant="destructive" size="icon" onClick={() => handleDeleteItem(item.id, item.name)} title="Delete Item">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
          )}
          {filteredInventory.length === 0 && !isLoading && currentUser && (
            <p className="text-center text-muted-foreground py-8">No items match your search, or inventory is empty.</p>
          )}
        </CardContent>
      </Card>

      {editingItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit: {editingItem.name}</DialogTitle>
              <DialogDescription>Make changes to your inventory item here. Click save when you're done.</DialogDescription>
            </DialogHeader>
            {editingItem.image && (
              <div className="my-4 flex flex-col items-center">
                <Image
                  src={editFormState.image || "https://placehold.co/80x80.png"}
                  alt={editingItem.name}
                  width={80}
                  height={80}
                  className="rounded object-cover mb-1"
                  data-ai-hint={editFormState.aiHint || ''}
                  onError={(e) => (e.currentTarget.src = "https://placehold.co/80x80.png")}
                />
                <p className="text-xs text-muted-foreground">Current Smart Suggestions: {editFormState.aiHint || 'N/A'}</p>
              </div>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" value={editFormState.name || ''} onChange={handleFormInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="aiHint" className="text-right">Smart Suggestions</Label>
                <Input id="aiHint" name="aiHint" value={editFormState.aiHint || ''} onChange={handleFormInputChange} className="col-span-3" placeholder="e.g. fresh tomato"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" value={editFormState.quantity || 0} onChange={handleFormInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">Unit</Label>
                <Input id="unit" name="unit" value={editFormState.unit || ''} onChange={handleFormInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <select id="category" name="category" value={editFormState.category || ''} onChange={handleFormInputChange} className="col-span-3 p-2 border rounded-md bg-input">
                    {defaultCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lowStockThreshold" className="text-right">Low Stock At</Label>
                <Input id="lowStockThreshold" name="lowStockThreshold" type="number" value={editFormState.lowStockThreshold || 0} onChange={handleFormInputChange} className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantityUsed" className="text-right">Quantity Used</Label>
                <Input id="quantityUsed" name="quantityUsed" type="number" value={editFormState.quantityUsed || 0} onChange={handleFormInputChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiryDate" className="text-right">Expiry Date</Label>
                <DatePicker 
                    date={editFormState.expiryDate ? parseISO(editFormState.expiryDate) : undefined} 
                    setDate={(d) => handleDateChange(d)} 
                    />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isAddDialogOpen && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
              <DialogDescription>Enter the details of the new item you want to add to your inventory.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" name="name" value={addFormState.name || ''} onChange={e => setAddFormState({ ...addFormState, name: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="aiHint" className="text-right">Smart Suggestions</Label>
                <Input id="aiHint" name="aiHint" value={addFormState.aiHint || ''} onChange={e => setAddFormState({ ...addFormState, aiHint: e.target.value })} className="col-span-3" placeholder="e.g. fresh tomato"/>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" value={addFormState.quantity || 0} onChange={e => setAddFormState({ ...addFormState, quantity: Math.max(0, parseFloat(e.target.value)) })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">Unit</Label>
                <Input id="unit" name="unit" value={addFormState.unit || ''} onChange={e => setAddFormState({ ...addFormState, unit: e.target.value })} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <select id="category" name="category" value={addFormState.category || ''} onChange={e => setAddFormState({ ...addFormState, category: e.target.value })} className="col-span-3 p-2 border rounded-md bg-input">
                    {defaultCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lowStockThreshold" className="text-right">Low Stock At</Label>
                <Input id="lowStockThreshold" name="lowStockThreshold" type="number" value={addFormState.lowStockThreshold || 0} onChange={e => setAddFormState({ ...addFormState, lowStockThreshold: Math.max(0, parseFloat(e.target.value)) })} className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expiryDate" className="text-right">Expiry Date</Label>
                <DatePicker 
                    date={addFormState.expiryDate ? parseISO(addFormState.expiryDate) : undefined} 
                    setDate={(d) => setAddFormState({ ...addFormState, expiryDate: d ? d.toISOString().split('T')[0] : '' })} 
                    />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" onClick={handleAddSubmit}>Add Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 🧠 SMART CSV MAPPING DIALOG */}
      {showMappingDialog && csvAnalysis && (
        <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Map CSV Fields to Inventory Fields</DialogTitle>
              <DialogDescription>
                I found some fields in your CSV that need to be mapped to inventory fields. Please confirm or adjust the mappings below.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {csvAnalysis.unmappedFields.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">All fields are already mapped!</p>
              ) : (
                csvAnalysis.unmappedFields.map(field => (
                  <div key={field.originalName} className="grid grid-cols-3 items-center gap-4">
                    <Label className="text-right">{field.originalName}</Label>
                    <select 
                      value={fieldMappings[field.originalName] || ''}
                      onChange={e => handleMappingChange(field.originalName, e.target.value)}
                      className="col-span-2 p-2 border rounded-md bg-input"
                    >
                      <option value="">Select a field...</option>
                      <option value="Name">Name</option>
                      <option value="Quantity">Quantity</option>
                      <option value="Unit">Unit</option>
                      <option value="Category">Category</option>
                      <option value="LowStockThreshold">Low Stock Threshold</option>
                      <option value="ExpiryDate (YYYY-MM-DD)">Expiry Date</option>
                      <option value="ImageURL">Image URL</option>
                      <option value="SmartSuggestions">Smart Suggestions</option>
                    </select>
                  </div>
                ))
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleConfirmMapping} disabled={isConverting}>
                {isConverting ? 'Converting...' : 'Confirm and Convert'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="text-center space-y-2">
          <div className="text-lg font-semibold text-blue-900">🧠 Smart CSV Import</div>
          <div className="text-sm text-blue-800">
            Upload any CSV format and our AI will automatically detect fields, standardize units, predict expiry dates, and categorize items!
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs mt-3">
            <div className="bg-white p-2 rounded border">
              <div className="font-medium text-green-700">✅ Auto-Detection</div>
              <div className="text-green-600">Recognizes product names, quantities, and units</div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="font-medium text-blue-700">🏷️ Smart Categories</div>
              <div className="text-blue-600">Classifies into 11 specific food categories</div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="font-medium text-orange-700">📅 Expiry Prediction</div>
              <div className="text-orange-600">Predicts shelf life with storage temps</div>
            </div>
            <div className="bg-white p-2 rounded border">
              <div className="font-medium text-purple-700">💡 Storage Tips</div>
              <div className="text-purple-600">Provides detailed storage guidance</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔔 Unified Notification System - Clean Professional Interface */}
      <div className="fixed top-20 right-4 z-50">
        {/* Single Notification Button */}
        <div className="relative">
          <Button
            onClick={() => setShowUnifiedNotifications(!showUnifiedNotifications)}
            variant="outline"
            size="sm"
            className="relative bg-white/95 backdrop-blur-sm border-blue-200 hover:border-blue-300 transition-all duration-300 shadow-lg"
          >
            <Bell className="h-4 w-4 text-blue-600" />
            {hasNewSuggestion && (
              <>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
              </>
            )}
            <span className="ml-1 text-xs hidden sm:inline">Quick Access</span>
          </Button>
          
          {/* Unified Dropdown with All Options */}
          {showUnifiedNotifications && (
            <div className="absolute top-12 right-0 w-80 max-w-[90vw] bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-blue-200 p-4 animate-in slide-in-from-top-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-blue-900">� Quick Access Panel</h3>
                <Button
                  onClick={() => {
                    setShowUnifiedNotifications(false);
                    setHasNewSuggestion(false);
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Smart SAM Section */}
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">🤖 Smart SAM Assistant</h4>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setShowChatbot(true);
                      setShowUnifiedNotifications(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-left p-2 h-auto"
                  >
                    <div>
                      <div className="font-medium">💬 Chat with Smart SAM</div>
                      <div className="text-xs text-gray-500">Get intelligent IOMS guidance</div>
                    </div>
                  </Button>
                  {samVoiceSupported && (
                    <>
                      <Button
                        onClick={() => {
                          setShowChatbot(true);
                          setShowUnifiedNotifications(false);
                          setTimeout(() => startSamVoiceRecognition(), 500);
                        }}
                        variant="ghost"
                        className="w-full justify-start text-left p-2 h-auto"
                        disabled={isSamListening}
                      >
                        <div className="flex items-center">
                          {isSamListening ? (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
                              <div className="font-medium">🎤 Listening to Smart SAM...</div>
                            </div>
                          ) : (
                            <div>
                              <div className="font-medium">🎤 Voice Chat with SAM</div>
                              <div className="text-xs text-gray-500">Speak directly to your assistant</div>
                            </div>
                          )}
                        </div>
                      </Button>
                      <Button
                        onClick={() => {
                          console.log('🔧 Direct voice test clicked');
                          
                          // Direct test without any dependencies
                          if (typeof window !== 'undefined') {
                            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                            
                            if (SpeechRecognition) {
                              const testRecognition = new SpeechRecognition();
                              testRecognition.continuous = false;
                              testRecognition.interimResults = false;
                              testRecognition.lang = 'en-US';
                              
                              testRecognition.onstart = () => {
                                console.log('🔧 Direct test: started listening');
                                alert('🎤 Listening... Say something!');
                              };
                              
                              testRecognition.onresult = (event: any) => {
                                const transcript = event.results[0][0].transcript;
                                console.log('🔧 Direct test heard:', transcript);
                                alert(`🎤 I heard: "${transcript}"`);
                              };
                              
                              testRecognition.onerror = (event: any) => {
                                console.error('🔧 Direct test error:', event.error);
                                alert(`🎤 Error: ${event.error}`);
                              };
                              
                              testRecognition.start();
                            } else {
                              alert('🎤 Speech Recognition not supported');
                            }
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs bg-yellow-50 border-yellow-300"
                      >
                        🔧 Direct Voice Test
                      </Button>
                    </>
                  )}
                  {!samVoiceSupported && (
                    <div className="p-2 bg-red-50 rounded border-l-2 border-red-400 text-sm">
                      🎤 Voice recognition not supported in this browser. Try Chrome or Edge.
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1 p-1 bg-gray-50 rounded">
                    Debug: Voice supported: {samVoiceSupported ? '✅ Yes' : '❌ No'} | 
                    Listening: {isSamListening ? '🎤 Yes' : '⭕ No'}
                    <br />
                    Browser: {typeof window !== 'undefined' ? 
                      (window.navigator.userAgent.includes('Chrome') ? 'Chrome ✅' :
                       window.navigator.userAgent.includes('Edge') ? 'Edge ✅' :
                       window.navigator.userAgent.includes('Safari') ? 'Safari ⚠️' :
                       window.navigator.userAgent.includes('Firefox') ? 'Firefox ❌' : 'Unknown') 
                      : 'Unknown'}
                  </div>
                </div>
              </div>
              
              {/* Quick Actions Section */}
              <div className="mb-4">
                <h4 className="font-medium text-purple-900 mb-2">⚡ Quick Actions</h4>
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setShowMappingDialog(true);
                      setShowUnifiedNotifications(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-left p-2 h-auto"
                  >
                    <div>
                      <div className="font-medium">📄 Upload CSV Menu</div>
                      <div className="text-xs text-gray-500">Smart conversion with AI optimization</div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => {
                      setIsListening(!isListening);
                      setShowUnifiedNotifications(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-left p-2 h-auto"
                  >
                    <div>
                      <div className="font-medium">🎤 Voice Search Inventory</div>
                      <div className="text-xs text-gray-500">Find items with voice commands</div>
                    </div>
                  </Button>
                </div>
              </div>
              
              {/* Suggestions Section */}
              <div>
                <h4 className="font-medium text-green-900 mb-2">💡 Smart Suggestions</h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                    💡 Build up your inventory with smart suggestions
                  </div>
                  <div className="p-2 bg-green-50 rounded border-l-2 border-green-400">
                    � Want AI-powered recommendations?
                  </div>
                  <div className="p-2 bg-purple-50 rounded border-l-2 border-purple-400">
                    🤖 Smart SAM can help optimize your stock
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🤖 Professional Floating Smart SAM Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Floating Chat Button */}
        <Button
          onClick={() => setShowChatbot(!showChatbot)}
          className="rounded-full h-14 w-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>

        {/* Professional Chat Interface */}
        {showChatbot && (
          <div className="absolute bottom-16 right-0 w-96 h-96 bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-200 flex flex-col animate-in slide-in-from-bottom-4">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🤖</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Smart SAM</h3>
                  <p className="text-xs text-gray-500">Intelligent Inventory Assistant</p>
                </div>
              </div>
              <Button
                onClick={() => setShowChatbot(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start gap-2 max-w-[85%]">
                    {/* Avatar for SAM */}
                    {message.type === 'sam' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        SAM
                      </div>
                    )}
                    
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm leading-relaxed ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md ml-auto'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap font-medium">
                        {message.message}
                      </div>
                      <div className={`text-xs mt-1 opacity-70 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    {/* Avatar for User */}
                    {message.type === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        YOU
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Auto-scroll to bottom */}
              <div ref={(el) => {
                if (el && chatMessages.length > 0) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
              {/* SAM Voice Transcript Display */}
              {(showSamTranscript && (isSamListening || samLiveTranscript)) && (
                <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {isSamListening && !samLiveTranscript && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-blue-600">SAM is listening...</span>
                          {/* SAM Audio Level Visualization */}
                          <div className="flex items-center gap-1 ml-2">
                            <div className="flex items-end gap-px h-3">
                              {[...Array(8)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-1 bg-gradient-to-t from-blue-400 to-blue-600 rounded-sm transition-all duration-100 ${
                                    samAudioLevel > i * 12.5 ? 'opacity-100' : 'opacity-20'
                                  }`}
                                  style={{ height: `${Math.max(2, (i + 1) * 1.5)}px` }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      {samLiveTranscript && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-purple-600">Live:</span>
                          <span className="text-purple-700 italic text-sm">"{samLiveTranscript}"</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setShowSamTranscript(false);
                        setSamLiveTranscript('');
                      }}
                      className="ml-2 p-1 hover:bg-blue-100 rounded text-blue-600 hover:text-blue-800 transition-colors"
                      title="Close transcript"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={isSamListening ? "🎤 SAM is listening... Speak now!" : "Ask Smart SAM about inventory..."}
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                    isSamListening ? 'border-blue-400 bg-blue-50' : ''
                  }`}
                  disabled={isSamListening}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && currentMessage.trim() && !isSamListening) {
                      sendMessageToSAM();
                    }
                  }}
                />
                {/* Enhanced Voice Input Button */}
                {samVoiceSupported && (
                  <Button
                    onClick={isSamListening ? stopSamVoiceListening : startSamVoiceListening}
                    size="sm"
                    variant={isSamListening ? "destructive" : "outline"}
                    className={`transition-all ${isSamListening ? "animate-pulse shadow-lg" : "hover:shadow-md"}`}
                    title={isSamListening ? "Stop SAM voice input" : "Start SAM voice input"}
                  >
                    {isSamListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button
                  onClick={sendMessageToSAM}
                  size="sm"
                  disabled={!currentMessage.trim() || isSamListening}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {isSamListening && (
                <div className="mt-2 text-xs text-center text-blue-600 animate-pulse">
                  🎤 Listening... Speak now!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </AppLayout>
    </TooltipProvider>
  );
}
