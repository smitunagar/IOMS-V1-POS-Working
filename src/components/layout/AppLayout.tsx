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
  UtensilsCrossed,
  History,
  Barcode, // Import BarcodeIcon
  LogOut, 
  Loader2,
  MessageSquareQuote, // Added for AI Order Agent
  BarChart3,
  Calendar,
  User, // Added for Receptionist
  Settings, // Added for module settings
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
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useWasteWatchDog } from "@/contexts/WasteWatchDogContext";
import { useSupplySync } from "@/contexts/SupplySyncContext";
import React, { useEffect, useState } from "react";
import { NotificationBell } from "./NotificationBell";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/menu-upload", label: "Menu Upload", icon: Boxes },
  { href: "/receptionist", label: "Receptionist", icon: User },
];

function SiteHeader({ pageTitle }: { pageTitle?: string }) {
  const { isMobile } = useSidebar();
  const { logout, currentUser } = useAuth();

  if (isMobile) {
    return (
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <SidebarTrigger className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-xs bg-sidebar text-sidebar-foreground p-0">
            <nav className="grid gap-6 text-lg font-medium p-4">
              <Link
                href="/"
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
              >
                <UtensilsCrossed className="h-5 w-5 transition-all group-hover:scale-110" />
                <span className="sr-only">IOMS</span>
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
               <Button variant="ghost" onClick={logout} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground justify-start">
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
        {pageTitle && <h1 className="text-xl font-semibold">{pageTitle}</h1>}
         <div className="flex items-center gap-2 sm:hidden">
            {currentUser && <NotificationBell />}
            {currentUser && (
              <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                <LogOut className="h-5 w-5" />
              </Button>
            )}
          </div>
      </header>
    );
  }

  return (
     <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-x-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-x-4">
            <SidebarTrigger className="hidden md:flex" />
            {pageTitle && <h1 className="text-xl font-semibold">{pageTitle}</h1>}
        </div>
        <div className="flex items-center gap-4">
          {currentUser && <NotificationBell />}
          {currentUser && (
              <Button variant="outline" onClick={logout} size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout ({currentUser.email?.split('@')[0]})
              </Button>
          )}
        </div>
    </header>
  );
}

export function AppLayout({
  children,
  pageTitle,
}: {
  children: React.ReactNode;
  pageTitle?: string;
}) {
  const pathname = usePathname();
  const { currentUser, isLoading, logout } = useAuth();
  const { isActive: isWasteWatchDogActive } = useWasteWatchDog();
  const { isActive: isSupplySyncActive } = useSupplySync();
  const router = useRouter();
  const [setupOpen, setSetupOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sidebarSetupOpen');
      return stored === 'true';
    }
    return false;
  });
  const [ordersOpen, setOrdersOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sidebarOrdersOpen');
      return stored === 'true';
    }
    return false;
  });
  const [reservationsOpen, setReservationsOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sidebarReservationsOpen');
      return stored === 'true';
    }
    return false;
  });
  const [aiToolOpen, setAiToolOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sidebarAiToolOpen');
      return stored === 'true';
    }
    return false;
  });
  const [inventoryOpen, setInventoryOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sidebarInventoryOpen');
      return stored === 'true';
    }
    return false;
  });
  const [wasteWatchDogOpen, setWasteWatchDogOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sidebarWasteWatchDogOpen');
      return stored === 'true';
    }
    return false;
  });
  
  const [supplySyncOpen, setSupplySyncOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('sidebarSupplySyncOpen');
      return stored === 'true';
    }
    return false;
  });

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Module visibility states
  const [moduleVisibility, setModuleVisibility] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ioms-module-visibility');
      if (stored) {
        return JSON.parse(stored);
      }
    }
    return {
      'WasteWatchDog': true,
      'SupplySync': true,
      'SmartInventory': false,
      'SmartChef': false,
      'Marketplace': true
    };
  });

  useEffect(() => {
    sessionStorage.setItem('sidebarSetupOpen', setupOpen ? 'true' : 'false');
  }, [setupOpen]);
  useEffect(() => {
    sessionStorage.setItem('sidebarOrdersOpen', ordersOpen ? 'true' : 'false');
  }, [ordersOpen]);
  useEffect(() => {
    sessionStorage.setItem('sidebarReservationsOpen', reservationsOpen ? 'true' : 'false');
  }, [reservationsOpen]);
  useEffect(() => {
    sessionStorage.setItem('sidebarAiToolOpen', aiToolOpen ? 'true' : 'false');
  }, [aiToolOpen]);
  useEffect(() => {
    sessionStorage.setItem('sidebarInventoryOpen', inventoryOpen ? 'true' : 'false');
  }, [inventoryOpen]);
  useEffect(() => {
    sessionStorage.setItem('sidebarWasteWatchDogOpen', wasteWatchDogOpen ? 'true' : 'false');
  }, [wasteWatchDogOpen]);
  
  useEffect(() => {
    sessionStorage.setItem('sidebarSupplySyncOpen', supplySyncOpen ? 'true' : 'false');
  }, [supplySyncOpen]);

  // Persist module visibility
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ioms-module-visibility', JSON.stringify(moduleVisibility));
    }
  }, [moduleVisibility]);

  const toggleModuleVisibility = (moduleName: string) => {
    setModuleVisibility((prev: any) => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl">Loading application...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8 text-sidebar-primary" />
            <h1 className="text-2xl font-semibold text-sidebar-foreground font-headline">
              IOMS
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.filter(item => !['POS', 'Order History', 'Order Analytics', 'Menu Upload', 'Reservation History', 'Reservation Analytics', 'Table Management', 'Receptionist'].includes(item.label)).map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className={cn(
                    "justify-start transition-all",
                    pathname === item.href
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className="mr-2 h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            {/* Receptionist link */}
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/receptionist'}
                className={cn(
                  "justify-start transition-all",
                  pathname === '/receptionist'
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                )}
              >
                <Link href="/receptionist" className="flex items-center gap-3">
                  <User className="mr-2 h-5 w-5 shrink-0" />
                  <span className="truncate">Receptionist</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* 2. Reservations Section Dropdown */}
            <SidebarMenuItem>
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none transition font-semibold",
                  reservationsOpen ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={() => setReservationsOpen((open) => !open)}
                aria-expanded={reservationsOpen}
              >
                <span className="mr-2">📅</span>
                Reservations
                <span className="ml-auto">{reservationsOpen ? '▲' : '▼'}</span>
              </button>
              {reservationsOpen && (
                <ul className="ml-6 mt-1 flex flex-col gap-1">
                  <li>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/table-management'}
                      className={cn(
                        "justify-start transition-all",
                        pathname === '/table-management'
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                      )}
                    >
                      <Link href="/table-management" className="flex items-center gap-3">
                        <Table className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">Table Management</span>
                      </Link>
                    </SidebarMenuButton>
                  </li>
                  <li>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/reservation-history'}
                      className={cn(
                        "justify-start transition-all",
                        pathname === '/reservation-history'
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                      )}
                    >
                      <Link href="/reservation-history" className="flex items-center gap-3">
                        <History className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">Reservation History</span>
                      </Link>
                    </SidebarMenuButton>
                  </li>
                  <li>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/reservation-analytics'}
                      className={cn(
                        "justify-start transition-all",
                        pathname === '/reservation-analytics'
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                      )}
                    >
                      <Link href="/reservation-analytics" className="flex items-center gap-3">
                        <BarChart3 className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">Reservation Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </li>
                </ul>
              )}
            </SidebarMenuItem>
            {/* 3. Orders Section Dropdown */}
            <SidebarMenuItem>
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none transition font-semibold",
                  ordersOpen ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={() => setOrdersOpen((open) => !open)}
                aria-expanded={ordersOpen}
              >
                <span className="mr-2">🧾</span>
                Orders
                <span className="ml-auto">{ordersOpen ? '▲' : '▼'}</span>
              </button>
              {ordersOpen && (
                <ul className="ml-6 mt-1 flex flex-col gap-1">
                  <li>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/payment'}
                      className={cn(
                        "justify-start transition-all",
                        pathname === '/payment'
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                      )}
                    >
                      <Link href="/payment" className="flex items-center gap-3">
                        <CreditCard className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">Payment</span>
                      </Link>
                    </SidebarMenuButton>
                  </li>
                  <li>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/order-entry'}
                      className={cn(
                        "justify-start transition-all",
                        pathname === '/order-entry'
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                      )}
                    >
                      <Link href="/order-entry" className="flex items-center gap-3">
                        <ShoppingCart className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">POS</span>
                      </Link>
                    </SidebarMenuButton>
                  </li>
                  <li>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/order-history'}
                      className={cn(
                        "justify-start transition-all",
                        pathname === '/order-history'
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                      )}
                    >
                      <Link href="/order-history" className="flex items-center gap-3">
                        <History className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">Order History</span>
                      </Link>
                    </SidebarMenuButton>
                  </li>
                  <li>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/order-analytics'}
                      className={cn(
                        "justify-start transition-all",
                        pathname === '/order-analytics'
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                      )}
                    >
                      <Link href="/order-analytics" className="flex items-center gap-3">
                        <BarChart3 className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">Order Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </li>
                </ul>
              )}
            </SidebarMenuItem>
            {/* 4. Inventory Section Dropdown with subsections */}
            <SidebarMenuItem>
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none transition font-semibold",
                  inventoryOpen ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={() => setInventoryOpen((open) => !open)}
                aria-expanded={inventoryOpen}
              >
                <span className="mr-2">📦</span>
                Inventory
                <span className="ml-auto">{inventoryOpen ? '▲' : '▼'}</span>
              </button>
              {inventoryOpen && (
                <ul className="ml-6 mt-1 flex flex-col gap-1">
                  <li>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/inventory'}
                      className={cn(
                        "justify-start transition-all",
                        pathname === '/inventory'
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                      )}
                    >
                      <Link href="/inventory" className="flex items-center gap-3">
                        <Boxes className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">Inventory</span>
                      </Link>
                    </SidebarMenuButton>
                  </li>
                  <li>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/serving-availability'}
                      className={cn(
                        "justify-start transition-all",
                        pathname === '/serving-availability'
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                      )}
                    >
                      <Link href="/serving-availability" className="flex items-center gap-3">
                        <UtensilsCrossed className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">Serving Availability</span>
                      </Link>
                    </SidebarMenuButton>
                  </li>
                  <li>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/inventory-analytics'}
                      className={cn(
                        "justify-start transition-all",
                        pathname === '/inventory-analytics'
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                      )}
                    >
                      <Link href="/inventory-analytics" className="flex items-center gap-3">
                        <BarChart3 className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">Inventory Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </li>
                  <li>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/barcode-scanner'}
                      className={cn(
                        "justify-start transition-all",
                        pathname === '/barcode-scanner'
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                      )}
                    >
                      <Link href="/barcode-scanner" className="flex items-center gap-3">
                        <Barcode className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">Barcode Scanner</span>
                      </Link>
                    </SidebarMenuButton>
                  </li>
                </ul>
              )}
            </SidebarMenuItem>
            {/* Setup Section */}
            <SidebarMenuItem>
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none transition font-semibold",
                  setupOpen ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={() => setSetupOpen((open) => !open)}
                aria-expanded={setupOpen}
              >
                <span className="mr-2">⚙️</span>
                Setup
                <span className="ml-auto">{setupOpen ? '▲' : '▼'}</span>
              </button>
              {setupOpen && (
                <ul className="ml-6 mt-1 flex flex-col gap-1">
                  <li>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/menu-upload'}
                      className={cn(
                        "justify-start transition-all",
                        pathname === '/menu-upload'
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                      )}
                    >
                      <Link href="/menu-upload" className="flex items-center gap-3">
                        <Boxes className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">Menu Upload</span>
                      </Link>
                    </SidebarMenuButton>
                  </li>
                  <li>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === '/dining-area-setup'}
                      className={cn(
                        "justify-start transition-all",
                        pathname === '/dining-area-setup'
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                          : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                      )}
                    >
                      <Link href="/dining-area-setup" className="flex items-center gap-3">
                        <UtensilsCrossed className="mr-2 h-5 w-5 shrink-0" />
                        <span className="truncate">Dining Area Setup</span>
                      </Link>
                    </SidebarMenuButton>
                  </li>
                  {/* Add more setup links here */}
                </ul>
              )}
            </SidebarMenuItem>

            
            {/* WasteWatchDog Section - Only visible when activated and module is visible */}
            {isWasteWatchDogActive && moduleVisibility['WasteWatchDog'] !== false && (
              <SidebarMenuItem>
                <button
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none transition font-semibold",
                    wasteWatchDogOpen ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  onClick={() => setWasteWatchDogOpen((open) => !open)}
                  aria-expanded={wasteWatchDogOpen}
                >
                  <span className="mr-2">♻️</span>
                  WasteWatchDog
                  <span className="ml-auto">{wasteWatchDogOpen ? '▲' : '▼'}</span>
                </button>
                {wasteWatchDogOpen && (
                  <ul className="ml-6 mt-1 flex flex-col gap-1">
                    <li>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === '/apps/wastewatchdog'}
                        className={cn(
                          "justify-start transition-all",
                          pathname === '/apps/wastewatchdog'
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                        )}
                      >
                        <Link href="/apps/wastewatchdog" className="flex items-center gap-3">
                          <BarChart3 className="mr-2 h-5 w-5 shrink-0" />
                          <span className="truncate">WasteWatch Dashboard</span>
                        </Link>
                      </SidebarMenuButton>
                    </li>
                    <li>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === '/apps/wastewatchdog/analytics'}
                        className={cn(
                          "justify-start transition-all",
                          pathname === '/apps/wastewatchdog/analytics'
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                        )}
                      >
                        <Link href="/apps/wastewatchdog/analytics" className="flex items-center gap-3">
                          <UtensilsCrossed className="mr-2 h-5 w-5 shrink-0" />
                          <span className="truncate">WasteWatch Analytics</span>
                        </Link>
                      </SidebarMenuButton>
                    </li>
                  </ul>
                )}
              </SidebarMenuItem>
            )}

            {/* SupplySync Section - Only visible when activated and module is visible */}
            {isSupplySyncActive && moduleVisibility['SupplySync'] !== false && (
              <SidebarMenuItem>
                <button
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none transition font-semibold",
                    supplySyncOpen ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  onClick={() => setSupplySyncOpen((open) => !open)}
                  aria-expanded={supplySyncOpen}
                >
                  <span className="mr-2">🚚</span>
                  SupplySync
                  <span className="ml-auto">{supplySyncOpen ? '▲' : '▼'}</span>
                </button>
                {supplySyncOpen && (
                  <ul className="ml-6 mt-1 flex flex-col gap-1">
                    <li>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === '/apps/supply-sync'}
                        className={cn(
                          "justify-start transition-all",
                          pathname === '/apps/supply-sync'
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold shadow-sm border-l-4 border-[#4C8BF5]"
                            : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground border-l-4 border-transparent"
                        )}
                      >
                        <Link href="/apps/supply-sync" className="flex items-center gap-3">
                          <Truck className="mr-2 h-5 w-5 shrink-0" />
                          <span className="truncate">Supply Dashboard</span>
                        </Link>
                      </SidebarMenuButton>
                    </li>
                  </ul>
                )}
              </SidebarMenuItem>
            )}
          </SidebarMenu>
          
          {/* Module Settings */}
          <div className="px-4 py-2 border-t border-sidebar-border mt-4">
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Module Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Module Visibility Settings
                  </DialogTitle>
                  <DialogDescription>
                    Toggle which specialized modules appear in your sidebar. Core navigation items are always visible.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">♻️</span>
                      <div>
                        <div className="font-medium">WasteWatchDog</div>
                        <div className="text-sm text-gray-500">2 features</div>
                      </div>
                    </div>
                    <Switch
                      checked={moduleVisibility['WasteWatchDog'] !== false}
                      onCheckedChange={() => toggleModuleVisibility('WasteWatchDog')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📦</span>
                      <div>
                        <div className="font-medium">SmartInventory</div>
                        <div className="text-sm text-gray-500">AI optimization</div>
                      </div>
                    </div>
                    <Switch
                      checked={moduleVisibility['SmartInventory'] !== false}
                      onCheckedChange={() => toggleModuleVisibility('SmartInventory')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">👨‍🍳</span>
                      <div>
                        <div className="font-medium">SmartChef</div>
                        <div className="text-sm text-gray-500">Recipe management</div>
                      </div>
                    </div>
                    <Switch
                      checked={moduleVisibility['SmartChef'] !== false}
                      onCheckedChange={() => toggleModuleVisibility('SmartChef')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🏪</span>
                      <div>
                        <div className="font-medium">Marketplace</div>
                        <div className="text-sm text-gray-500">Browse apps</div>
                      </div>
                    </div>
                    <Switch
                      checked={moduleVisibility['Marketplace'] !== false}
                      onCheckedChange={() => toggleModuleVisibility('Marketplace')}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setSettingsOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </SidebarContent>
        <SidebarHeader className="border-t border-sidebar-border mt-auto">
           <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={logout}
                    className={cn(
                        "justify-start w-full",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                >
                    <LogOut className="mr-2 h-5 w-5 shrink-0" />
                    <span className="truncate">Logout</span>
                </SidebarMenuButton>
             </SidebarMenuItem>
           </SidebarMenu>
        </SidebarHeader>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <SiteHeader pageTitle={pageTitle} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
} 