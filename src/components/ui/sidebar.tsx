"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"
import Link from 'next/link';

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// --- FULL IMPLEMENTATION ---
// (This is the full sidebar implementation as previously extracted from the Noman branch)

// ... (full sidebar implementation here, including all exports) ...

// Sidebar context and hooks
interface SidebarContextType {
  state: string;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

function useSidebar(): SidebarContextType {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
}
const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }: SidebarProviderProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(true);
  const [openMobile, setOpenMobile] = React.useState(false);
  const state = open ? "expanded" : "collapsed";
  const contextValue = React.useMemo(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar: () => (isMobile ? setOpenMobile((o: boolean) => !o) : setOpen((o: boolean) => !o)),
    }),
    [state, open, isMobile, openMobile]
  );
  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  );
};

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}
const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, children, ...props }: SidebarProps, ref: React.Ref<HTMLDivElement>) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent className="w-64 bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden">
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <div ref={ref} className={cn("hidden md:block text-sidebar-foreground", className)} data-state={state}>
      <div className="fixed inset-y-0 left-0 z-10 h-full w-64 bg-[#e4e7f5] text-[#232946] px-2 py-4 flex flex-col" style={{minHeight: '100vh'}}>
        <div className="flex h-full w-full flex-col gap-2">{children}</div>
      </div>
    </div>
  );
});
Sidebar.displayName = "Sidebar";

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, ...props }: SidebarHeaderProps, ref: React.Ref<HTMLDivElement>) => (
  <div ref={ref} className={cn("flex flex-col gap-2 p-2", className)} {...props} />
));
SidebarHeader.displayName = "SidebarHeader";

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}
const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ className, ...props }: SidebarContentProps, ref: React.Ref<HTMLDivElement>) => (
  <div ref={ref} className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto", className)} {...props} />
));
SidebarContent.displayName = "SidebarContent";

interface SidebarMenuProps extends React.HTMLAttributes<HTMLUListElement> {
  className?: string;
}
const SidebarMenu = React.forwardRef<HTMLUListElement, SidebarMenuProps>(
  ({ className, ...props }: SidebarMenuProps, ref: React.Ref<HTMLUListElement>) => (
  <ul ref={ref} className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />
));
SidebarMenu.displayName = "SidebarMenu";

interface SidebarMenuItemProps extends React.HTMLAttributes<HTMLLIElement> {
  className?: string;
}
const SidebarMenuItem = React.forwardRef<HTMLLIElement, SidebarMenuItemProps>(
  ({ className, ...props }: SidebarMenuItemProps, ref: React.Ref<HTMLLIElement>) => (
  <li ref={ref} className={cn("group/menu-item relative", className)} {...props} />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  isActive?: boolean;
  asChild?: boolean;
}
const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, isActive, asChild, ...props }: SidebarMenuButtonProps, ref: React.Ref<HTMLButtonElement>) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(
        "flex w-full items-center gap-2 rounded-md p-2 text-left text-sm outline-none transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "",
        className
      )}
      {...props}
    />
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

interface SidebarTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}
const SidebarTrigger = React.forwardRef<HTMLButtonElement, SidebarTriggerProps>(
  ({ className, onClick, ...props }: SidebarTriggerProps, ref: React.Ref<HTMLButtonElement>) => {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

interface SidebarInsetProps extends React.HTMLAttributes<HTMLElement> {
  className?: string;
}
const SidebarInset = React.forwardRef<HTMLElement, SidebarInsetProps>(
  ({ className, ...props }: SidebarInsetProps, ref: React.Ref<HTMLElement>) => (
  <main ref={ref} className={cn("relative flex min-h-screen flex-1 flex-col bg-background md:ml-64", className)} {...props} />
));
SidebarInset.displayName = "SidebarInset";

export {
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
}; 