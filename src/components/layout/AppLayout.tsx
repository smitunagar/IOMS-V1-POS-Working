"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ShoppingCart,
  Table,
  CreditCard,
  Sparkles,
  Boxes,
  BarChartBig,
  UtensilsCrossed,
  History,
  Barcode, // Import BarcodeIcon
  LogOut, 
  Loader2,
  MessageSquareQuote, // Added for AI Order Agent
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect } from "react";
import { NotificationBell } from "./NotificationBell";

// ... rest of the file ... 