
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
  LayoutGrid,
  Soup,
  BookOpenText,
  Settings,
  User,
  LogOut,
  History,
  LayoutDashboard,
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import type { UserWithRole } from '@/lib/auth';
import { signOut } from '@/lib/actions';


const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, role: 'admin' },
  { href: '/', label: 'POS', icon: LayoutGrid, role: 'cashier' },
  { href: '/kds', label: 'KDS', icon: Soup, role: 'head_chef' },
  { href: '/menu', label: 'Menu Board', icon: BookOpenText, role: 'admin' },
  { href: '/history', label: 'Order History', icon: History, role: 'admin' },
  { href: '/settings', label: 'Settings', icon: Settings, role: 'admin' },
];

const rolePermissions: Record<string, string[]> = {
  admin: ['/dashboard', '/', '/kds', '/menu', '/history', '/settings'],
  cashier: ['/'],
  head_chef: ['/kds'],
};


export function KaspaLogo() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 text-sidebar-primary-foreground"
    >
      <path d="M6 3L12 9L6 15V3Z" fill="currentColor" />
      <path d="M6 15L12 9L18 3V9L12 15H6Z" fill="currentColor" />
      <path d="M6 21L12 15L6 9V21Z" fill="currentColor" />
      <path d="M12 15L18 21V15L12 9L12 15Z" fill="currentColor" />
    </svg>
  );
}


export function AppSidebar({ user }: { user: UserWithRole | null }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const navItems = React.useMemo(() => {
    if (!user?.role) return [];
    
    const allowedHrefs = rolePermissions[user.role];
    if (!allowedHrefs) return [];

    return allNavItems.filter(item => allowedHrefs.includes(item.href));
  }, [user]);

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';
  const userRole = user?.role ? user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Guest';

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-2">
        <div className="flex items-center justify-between">
           <SidebarMenu>
             <SidebarMenuItem>
               <SidebarMenuButton className="h-12 justify-start group-data-[collapsible=icon]:justify-center">
                  <div className="bg-primary p-2 rounded-lg">
                    <KaspaLogo />
                  </div>
                  <span className="font-bold text-lg font-headline text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                    SwiftServe
                  </span>
               </SidebarMenuButton>
             </SidebarMenuItem>
           </SidebarMenu>
            {isMobile && <SidebarTrigger />}
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} onClick={handleLinkClick}>
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
            <AvatarImage src="" alt="User" />
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
             <span className="font-semibold text-sidebar-foreground">{user?.email}</span>
             <span className="text-xs text-muted-foreground">{userRole}</span>
          </div>
        </div>
        <form action={signOut}>
            <Button type="submit" variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <LogOut className="mr-2 h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}
