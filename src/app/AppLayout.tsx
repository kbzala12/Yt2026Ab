
"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, Wallet, LogIn, LogOut, Bot, X, HelpCircle, Shield, Send, GitBranch, Rocket, Languages } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface UserSession {
  id: string;
  username: string;
  coins: number;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  const showSidebar = pathname !== '/login' && pathname !== '/register' && !pathname.startsWith('/watch');

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between p-4">
             <Link href="/" className="text-2xl font-bold text-primary">kbyt</Link>
             <div className="flex items-center gap-2">
                {isClient && user ? (
                    <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                        <LogOut className="h-5 w-5" />
                    </Button>
                ) : (
                    isClient && (
                        <Button asChild variant="ghost" size="icon" title="Login">
                            <Link href="/login">
                                <LogIn className="h-5 w-5"/>
                            </Link>
                        </Button>
                    )
                )}
             </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/"}>
                <Link href="/">
                  <Home />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
             {user && isClient && (
               <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/wallet"}>
                    <Link href="/wallet">
                      <Wallet />
                      <span>Wallet</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/submit"}>
                    <Link href="/submit">
                      <Bot />
                      <span>Submit URL</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 {user.username === 'zalakb0005' && (
                    <>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/admin"}>
                                <Link href="/admin">
                                <Shield />
                                <span>Admin Panel</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === "/deploy"}>
                                <Link href="/deploy">
                                <Rocket />
                                <span>Deploy App</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </>
                )}
              </>
            )}
             <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/how-it-works"}>
                <Link href="/how-it-works">
                  <HelpCircle />
                  <span>How It Works</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="https://t.me/Bingyt_bot" target="_blank" rel="noopener noreferrer">
                  <Send />
                  <span>Help Center</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        {/* Mobile Header */}
        <header className="flex items-center justify-between gap-2 p-2 border-b md:hidden sticky top-0 bg-background z-30">
          <SidebarTrigger />
           <Link href="/" className="text-lg font-bold text-primary">kbyt</Link>
          <div className="flex items-center">
            {isClient && user ? (
                <Button size="icon" variant="ghost" asChild>
                    <Link href="/wallet"><Wallet/></Link>
                </Button>
            ) : <div className="w-10"></div>}
          </div>
        </header>
        {children}
        {/* Floating Close Button */}
        {pathname !== '/' && (
            <Button asChild className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50">
                <Link href="/">
                    <X className="h-8 w-8" />
                    <span className="sr-only">Close</span>
                </Link>
            </Button>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
