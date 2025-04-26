import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Menu, 
  Bell, 
  Settings,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import CartSidebar from "@/components/CartSidebar";
import { useCart } from "@/hooks/use-cart";

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();
  const [userRole, setUserRole] = useState<string>("eater");
  const [cartOpen, setCartOpen] = useState(false);
  const { items } = useCart();
  
  useEffect(() => {
    const getUserRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("clerk_user_id", user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user role:", error);
          return;
        }
        
        if (data) {
          setUserRole(data.role);
          
          // Redirect admin users if they're not on the admin page
          if (data.role === "admin" && pathname === "/dashboard") {
            navigate("/dashboard/admin");
          }
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };
    
    getUserRole();
  }, [user, pathname, navigate]);
  
  const navItems = [
    {
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      href: "/dashboard",
      roles: ["eater", "delivery", "admin"],
    },
    {
      label: "Order Food",
      icon: <ShoppingCart className="h-5 w-5" />,
      href: "/dashboard/order",
      roles: ["eater", "delivery", "admin"],
    },
    {
      label: "My Orders",
      icon: <Package className="h-5 w-5" />,
      href: "/dashboard/my-orders",
      roles: ["eater", "delivery", "admin"],
    },
    {
      label: "Deliver",
      icon: <Menu className="h-5 w-5" />,
      href: "/dashboard/deliver",
      roles: ["delivery", "admin"],
    },
    {
      label: "My Deliveries",
      icon: <Bell className="h-5 w-5" />,
      href: "/dashboard/my-deliveries",
      roles: ["delivery", "admin"],
    },
    {
      label: "Admin",
      icon: <Settings className="h-5 w-5" />,
      href: "/dashboard/admin",
      roles: ["admin"],
    },
  ];
  
  const filteredNavItems = navItems.filter((item) => 
    item.roles.includes(userRole)
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-hungryaf-primary">
                HungryAF
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            {/* Cart button */}
            {(userRole === "eater" || userRole === "admin") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCartOpen(true)}
                className="relative rounded-full"
              >
                <ShoppingCart className="h-5 w-5" />
                {items.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-hungryaf-primary text-xs text-white">
                    {items.length}
                  </span>
                )}
              </Button>
            )}
            
            {/* User button */}
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Sidebar navigation */}
        <aside className="hidden w-64 flex-shrink-0 border-r bg-background lg:block">
          <nav className="flex flex-col gap-2 p-4">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-hungryaf-primary/10 text-hungryaf-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background lg:hidden">
          <nav className="grid grid-cols-4 gap-1">
            {filteredNavItems.slice(0, 4).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex flex-col items-center gap-1 p-3 text-center text-xs ${
                    isActive
                      ? "text-hungryaf-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          <div className="hungryaf-container">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Cart sidebar */}
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default DashboardLayout;
