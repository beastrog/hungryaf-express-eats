
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";
import { ShoppingCart, Menu, Package, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import OrderStatusCard from "@/components/OrderStatusCard";
import { motion } from "framer-motion";

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const Dashboard = () => {
  const { user } = useUser();
  const [userRole, setUserRole] = useState("eater");
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserInfo = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("users")
          .select("role, id")
          .eq("clerk_user_id", user.id)
          .single();
        
        if (error) {
          console.error("Error fetching user:", error);
          return;
        }
        
        if (data) {
          setUserRole(data.role);
          
          // Fetch recent orders for this user
          const { data: orders, error: ordersError } = await supabase
            .from("orders")
            .select("*, deliveries(*)")
            .eq("user_id", data.id)
            .order("created_at", { ascending: false })
            .limit(3);
          
          if (ordersError) {
            console.error("Error fetching orders:", ordersError);
          } else {
            setRecentOrders(orders || []);
          }
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    getUserInfo();
    
    // Set up real-time subscription for orders
    const ordersSubscription = supabase
      .channel("orders-channel")
      .on("postgres_changes", 
        { event: "UPDATE", schema: "public", table: "orders" }, 
        (payload) => {
          toast.info("An order has been updated!");
          // Refresh orders
          getUserInfo();
        }
      )
      .subscribe();
    
    return () => {
      ordersSubscription.unsubscribe();
    };
  }, [user]);

  const userShortName = user?.firstName || user?.username || "User";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {userShortName}!</h1>
        <p className="text-muted-foreground">
          {userRole === "eater" && "Ready to order some delicious food?"}
          {userRole === "delivery" && "Ready to make some deliveries?"}
          {userRole === "admin" && "Manage your food delivery service"}
        </p>
      </section>
      
      {/* Quick Actions */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <Link to="/dashboard/order">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                <ShoppingCart className="h-8 w-8 mb-2 text-hungryaf-primary" />
                <p className="font-medium text-center">Order Food</p>
              </CardContent>
            </Link>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <Link to="/dashboard/my-orders">
              <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                <Package className="h-8 w-8 mb-2 text-hungryaf-primary" />
                <p className="font-medium text-center">My Orders</p>
              </CardContent>
            </Link>
          </Card>
          
          {userRole === "delivery" && (
            <Card className="hover:shadow-md transition-shadow">
              <Link to="/dashboard/deliver">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                  <Menu className="h-8 w-8 mb-2 text-hungryaf-primary" />
                  <p className="font-medium text-center">Deliver</p>
                </CardContent>
              </Link>
            </Card>
          )}
          
          {userRole === "delivery" && (
            <Card className="hover:shadow-md transition-shadow">
              <Link to="/dashboard/my-deliveries">
                <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                  <Bell className="h-8 w-8 mb-2 text-hungryaf-primary" />
                  <p className="font-medium text-center">My Deliveries</p>
                </CardContent>
              </Link>
            </Card>
          )}
        </div>
      </section>

      {/* Recent Orders */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Button variant="outline" asChild>
            <Link to="/dashboard/my-orders">View All</Link>
          </Button>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No orders yet</p>
              <Button asChild className="mt-4 bg-hungryaf-primary hover:bg-hungryaf-primary/90">
                <Link to="/dashboard/order">Order Now</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentOrders.map((order) => (
              <OrderStatusCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
};

export default Dashboard;
