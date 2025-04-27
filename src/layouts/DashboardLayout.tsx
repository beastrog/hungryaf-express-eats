
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CartSidebar } from "@/components/CartSidebar"; // Named import
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Sun, Moon, Menu, ShoppingCart, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/use-cart";
import Notifications from "@/components/Notifications";
import { supabase } from "@/integrations/supabase/client";

const DashboardLayout = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { items } = useCart();
  const [userRole, setUserRole] = useState<string>('eater');

  // Get the user role from the database
  useState(() => {
    const fetchUserRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (!error && data) {
          setUserRole(data.role);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    };
    
    fetchUserRole();
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const isLinkActive = (path: string) => location.pathname === path;

  const getNavItemClasses = (path: string) => {
    return cn(
      "flex items-center space-x-2 rounded-md px-3 py-2 transition-colors",
      isLinkActive(path) 
        ? "bg-hungryaf-primary text-white"
        : "hover:bg-hungryaf-primary/10"
    );
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>,
    },
    {
      name: "Order Food",
      path: "/dashboard/order",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 6h19v12H3V6Z" /><path d="m12.5 13-3-3h5.5l3 3H12.5Z" /></svg>,
    },
    {
      name: "My Orders",
      path: "/dashboard/my-orders",
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" /><path d="M8 6h8" /><path d="M8 10h8" /><path d="M8 14h8" /><path d="M8 18h8" /></svg>,
    },
  ];

  // Add delivery options if user is a delivery partner
  if (userRole === 'delivery') {
    navItems.push(
      {
        name: "Deliver",
        path: "/dashboard/deliver",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 15 15" /></svg>,
      },
      {
        name: "My Deliveries",
        path: "/dashboard/my-deliveries", 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
      }
    );
  }

  // Add admin options if user is an admin
  if (userRole === 'admin') {
    navItems.push(
      {
        name: "Admin",
        path: "/dashboard/admin",
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
      }
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile Menu Trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={getNavItemClasses(item.path)}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-1">
              <span className="font-bold text-xl">Hungry<span className="text-hungryaf-primary">AF</span></span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isLinkActive(item.path)
                    ? "bg-hungryaf-primary text-white"
                    : "text-muted-foreground hover:bg-hungryaf-primary/10 hover:text-foreground"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Notifications />

            {/* Cart Button */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-hungryaf-primary text-white text-xs flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                  <span className="sr-only">Open cart</span>
                </Button>
              </SheetTrigger>
              <CartSidebar />
            </Sheet>
            
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            {/* User Menu */}
            <div className="relative">
              <Button variant="outline" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sign out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main 
        className="container py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Outlet />
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
