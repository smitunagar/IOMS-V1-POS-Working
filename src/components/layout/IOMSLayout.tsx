"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Menu,
  Settings,
  ToggleLeft,
  ToggleRight,
  X
} from 'lucide-react';
import { 
  Sidebar,
  SidebarContent as ShadcnSidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider as ShadcnSidebarProvider,
  SidebarTrigger,
  SidebarInset
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { sidebarConfig, getActiveRouteInfo, shouldExpandModule } from '@/lib/sidebarConfig';

interface IOMSLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

function SidebarContent() {
  const { 
    expandedModules, 
    toggleModule, 
    setModuleExpanded, 
    moduleVisibility, 
    toggleModuleVisibility 
  } = useSidebar();
  const pathname = usePathname();
  const { item: activeItem, subItem: activeSubItem } = getActiveRouteInfo(pathname);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const lastPathnameRef = useRef<string>('');

  // Auto-expand modules based on current route - only when pathname changes
  useEffect(() => {
    if (pathname !== lastPathnameRef.current) {
      lastPathnameRef.current = pathname;
      
      [...sidebarConfig.mainNavigation, ...sidebarConfig.modules].forEach(item => {
        if (shouldExpandModule(pathname, item)) {
          setModuleExpanded(item.title, true);
        }
      });
    }
  }, [pathname, setModuleExpanded]);

  const ModuleToggleSettings = () => (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start text-gray-600 hover:text-gray-900"
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
          {sidebarConfig.modules.map((module) => (
            <div key={module.title} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <module.icon className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium">{module.title}</div>
                  <div className="text-sm text-gray-500">
                    {module.subItems?.length || 0} features
                  </div>
                </div>
              </div>
              <Switch
                checked={moduleVisibility[module.title] !== false}
                onCheckedChange={() => toggleModuleVisibility(module.title)}
              />
            </div>
          ))}
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
  );

  const renderSidebarItem = (item: typeof sidebarConfig.mainNavigation[0], isModule = false) => {
    const isExpanded = expandedModules[item.title] || false;
    const isActive = activeItem?.title === item.title;
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <SidebarMenuItem key={item.title}>
        {/* Main item */}
        <SidebarMenuButton asChild={!hasSubItems}>
          {hasSubItems ? (
            <div 
              className={`flex items-center justify-between w-full p-2 rounded-md cursor-pointer transition-all hover:bg-gray-100 ${
                isActive ? 'bg-blue-100 text-blue-900' : ''
              }`}
              onClick={() => toggleModule(item.title)}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`w-4 h-4 ${isModule ? 'text-green-600' : ''}`} />
                <span className="font-medium">{item.title}</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </div>
          ) : (
            <Link 
              href={item.href || '#'} 
              className={`flex items-center space-x-3 ${
                isActive ? 'bg-blue-100 text-blue-900' : ''
              }`}
            >
              <item.icon className={`w-4 h-4 ${isModule ? 'text-green-600' : ''}`} />
              <span className="font-medium">{item.title}</span>
            </Link>
          )}
        </SidebarMenuButton>

        {/* Sub-items */}
        {hasSubItems && isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {item.subItems!.map((subItem) => {
              const isSubActive = activeSubItem?.href === subItem.href;
              return (
                <SidebarMenuButton key={subItem.href} asChild>
                  <Link 
                    href={subItem.href}
                    className={`flex items-start space-x-3 p-2 rounded-md transition-all hover:bg-gray-50 ${
                      isSubActive ? 'bg-blue-50 text-blue-900 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <subItem.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex flex-col items-start min-w-0">
                      <span className="font-medium text-sm truncate">{subItem.title}</span>
                      <span className="text-xs text-gray-500 truncate">{subItem.description}</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              );
            })}
          </div>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="border-r">
      <ShadcnSidebarContent>
        {/* Header */}
        <SidebarHeader>
          <div className="flex items-center space-x-3 p-2">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Link>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">🏢</span>
              </div>
              <span className="font-bold text-gray-900">IOMS</span>
            </div>
          </div>
        </SidebarHeader>

        {/* Main Navigation */}
        <div className="px-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Core Navigation
          </div>
          <SidebarMenu className="space-y-1">
            {sidebarConfig.mainNavigation.map((item) => renderSidebarItem(item))}
          </SidebarMenu>
        </div>

        {/* Modules Section */}
        <div className="px-2 mt-6">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Specialized Modules
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>
          
          <SidebarMenu className="space-y-1">
            {sidebarConfig.modules
              .filter(item => moduleVisibility[item.title] !== false)
              .map((item) => renderSidebarItem(item, true))
            }
          </SidebarMenu>
          
          {/* Show module settings if no modules are visible */}
          {sidebarConfig.modules.filter(item => moduleVisibility[item.title] !== false).length === 0 && (
            <div className="text-center py-4 px-2">
              <div className="text-sm text-gray-500 mb-2">No modules enabled</div>
              <ModuleToggleSettings />
            </div>
          )}
        </div>

        {/* Settings at bottom */}
        <div className="px-2 mt-auto mb-4">
          <ModuleToggleSettings />
        </div>
      </ShadcnSidebarContent>
    </Sidebar>
  );
}

function IOMSLayoutContent({ children, pageTitle }: IOMSLayoutProps) {
  return (
    <ShadcnSidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarContent />

        {/* Main Content */}
        <SidebarInset>
          {/* Top Bar */}
          <div className="border-b bg-white p-4">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">🏢</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {pageTitle || 'IOMS Enterprise'}
                </span>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 bg-gray-50">
            {children}
          </div>
        </SidebarInset>
      </div>
    </ShadcnSidebarProvider>
  );
}

export function IOMSLayout({ children, pageTitle }: IOMSLayoutProps) {
  return (
    <SidebarProvider>
      <IOMSLayoutContent pageTitle={pageTitle}>
        {children}
      </IOMSLayoutContent>
    </SidebarProvider>
  );
}
