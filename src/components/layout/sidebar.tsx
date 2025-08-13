
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  ChefHat,
  LayoutGrid,
  Soup,
  BookOpenText,
  Settings,
  User,
  LogOut,
  History,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';

const navItems = [
  { href: '/', label: 'POS', icon: LayoutGrid },
  { href: '/kds', label: 'KDS', icon: Soup },
  { href: '/menu', label: 'Menu Board', icon: BookOpenText },
  { href: '/history', label: 'Order History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2 justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <ChefHat className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg font-headline text-sidebar-foreground">SwiftServe</span>
          </div>
          {isMobile && <SidebarTrigger />}
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={{ children: item.label, side: 'right' }}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Separator className="my-2 bg-sidebar-border" />
        <div
          className="flex items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User" data-ai-hint="user avatar" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate">
             <span className="font-semibold text-sidebar-foreground">Jane Doe</span>
             <span className="text-xs text-muted-foreground">Cashier</span>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
