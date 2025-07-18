'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarContent, SidebarInset, SidebarTrigger, SidebarFooter } from "@/components/ui/sidebar";
import { LayoutDashboard, ShoppingCart, Newspaper, User, LogOut, HeartPulse } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/dashboard/patient', label: 'Patient Panel', icon: User },
    { href: '/dashboard/admin', label: 'Admin Panel', icon: LayoutDashboard },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
    { href: '/blog', label: 'Blog', icon: Newspaper },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <HeartPulse className="text-primary size-8" />
            <h1 className="text-2xl font-bold font-headline text-primary">Foot Haven</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/">
                  <LogOut />
                  <span>Logout</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6 sticky top-0 z-40">
            <SidebarTrigger className="md:hidden" />
            <h2 className="text-lg font-semibold font-headline">
                {menuItems.find(item => pathname.startsWith(item.href))?.label || 'Dashboard'}
            </h2>
        </header>
        <main className="p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
