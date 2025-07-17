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
import React, { useEffect, useState } from "react";
import { NotificationBell } from "./NotificationBell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: "/", label: "Order Entry", icon: ShoppingCart },
  { href: "/tables", label: "Table Management", icon: Table },
  { href: "/payment", label: "Payment", icon: CreditCard },
  { href: "/order-history", label: "Order History", icon: History },
  { href: "/ingredient-tool", label: "AI Ingredient Tool", icon: Sparkles },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/ai-order-agent", label: "AI Order Agent", icon: MessageSquareQuote }, // New Item
  { href: "/barcode-scanner", label: "Barcode Scanner", icon: Barcode }, // New Item for Barcode Scanner
  { href: "/dashboard", label: "Analytics", icon: BarChartBig },
  { href: "/menu-upload", label: "Menu Upload", icon: Boxes }, // <-- Added Menu Upload here
];

function UserProfileModal({ open, onClose, user, onSave, onLogout }: { open: boolean, onClose: () => void, user: any, onSave: (data: any) => void, onLogout: () => void }) {
  const [email, setEmail] = useState(user?.email || "");
  const [restaurantName, setRestaurantName] = useState(user?.restaurantName || "");
  useEffect(() => {
    setEmail(user?.email || "");
    setRestaurantName(user?.restaurantName || "");
  }, [user]);
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Restaurant Name</label>
            <input type="text" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input type="password" value={"********"} disabled className="w-full border rounded p-2 bg-gray-100" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onSave({ email, restaurantName })}>Save</Button>
          <Button variant="outline" onClick={onLogout}>Logout</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SiteHeader({ pageTitle }: { pageTitle?: string }) {
  const { isMobile } = useSidebar();
  const { logout, currentUser } = useAuth();
  // Remove UserProfileModal and all related state/handlers

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
          <SheetContent side="left" className="sm:max-w-xs bg-sidebar text-sidebar-foreground p-0">
            <nav className="grid gap-6 text-lg font-medium p-4">
              <Link
                href="/"
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
              >
                <UtensilsCrossed className="h-5 w-5 transition-all group-hover:scale-110" />
                <span className="sr-only">Webmeister360AI</span>
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
        {currentUser && (
  <Link href="/profile">
    <Button variant="outline" size="sm">
      <UtensilsCrossed className="mr-2 h-4 w-4" />
      User Profile
    </Button>
  </Link>
)}
      </header>
    );
  }

  return (
     <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-x-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center gap-x-4">
            <SidebarTrigger className="hidden md:flex" />
            {pageTitle && <h1 className="text-xl font-semibold">{pageTitle}</h1>}
        </div>
        <div className="flex items-center gap-2">
          {currentUser && <NotificationBell />}
          {currentUser && (
              <>
                {currentUser && (
  <Link href="/profile">
    <Button variant="outline" size="sm">
      <UtensilsCrossed className="mr-2 h-4 w-4" />
      User Profile
    </Button>
  </Link>
)}
              </>
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
  const router = useRouter();
  // Remove UserProfileModal and all related state/handlers

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
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8 text-sidebar-primary" />
            <h1 className="text-2xl font-semibold text-sidebar-foreground font-headline">
              Webmeister360AI
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  className={cn(
                    "justify-start",
                    pathname === item.href ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  tooltip={{
                    children: item.label,
                    className: "bg-background text-foreground border-border",
                  }}
                >
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarHeader className="border-t border-sidebar-border mt-auto">
           <SidebarMenu>
             <SidebarMenuItem>
                <SidebarMenuButton
                    // onClick={() => setProfileOpen(true)} // Removed as per edit hint
                    className={cn(
                        "justify-start w-full",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    tooltip={{
                        children: "User Profile",
                        className: "bg-background text-foreground border-border",
                    }}
                >
                    <UtensilsCrossed className="mr-2 h-5 w-5 shrink-0" />
                    <span className="truncate">User Profile</span>
                </SidebarMenuButton>
                {/* <UserProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={currentUser} onSave={handleSaveProfile} onLogout={logout} /> */}
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
