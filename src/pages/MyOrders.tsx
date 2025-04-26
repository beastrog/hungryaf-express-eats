import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrderStatusCard from "@/components/OrderStatusCard";
import { Skeleton } from "@/components/ui/skeleton";

// Initialize Supabase client with environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const MyOrders = () => {
  const { user } = useUser();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserIdAndOrders = async () => {
      if (!user) return;

      try {
        // Get user's Supabase ID from Clerk ID
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", user.id)
          .single();

        if (error || !data) {
          console.error("Error fetching user ID:", error);
          return;
        }

        setUserId(data.id);

        // Get orders for this user
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*, deliveries(*)")
          .eq("user_id", data.id)
          .order("created_at", { ascending: false });

        if (ordersError) {
          console.error("Error fetching orders:", ordersError);
          return;
        }

        setOrders(ordersData || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    getUserIdAndOrders();

    // Set up real-time subscription
    if (userId) {
      const ordersSubscription = supabase
        .channel("orders-channel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            // Refresh orders on any change
            getUserIdAndOrders();
          }
        )
        .subscribe();

      return () => {
        ordersSubscription.unsubscribe();
      };
    }
  }, [user, userId]);

  // Filter orders by status
  const pendingOrders = orders.filter((order) => 
    order.status === "placed" || 
    order.status === "paid" && 
    (!order.deliveries[0] || order.deliveries[0].status !== "completed")
  );
  
  const completedOrders = orders.filter((order) => 
    order.status === "delivered" || 
    (order.deliveries[0] && order.deliveries[0].status === "completed")
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-medium mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">
            You haven't placed any orders yet. Start ordering your favorite food now!
          </p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {orders.map((order) => (
                <motion.div key={order.id} variants={item}>
                  <OrderStatusCard order={order} />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="pending">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending orders</p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {pendingOrders.map((order) => (
                  <motion.div key={order.id} variants={item}>
                    <OrderStatusCard order={order} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No completed orders</p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={container}
                initial="hidden"
                animate="show"
              >
                {completedOrders.map((order) => (
                  <motion.div key={order.id} variants={item}>
                    <OrderStatusCard order={order} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MyOrders;
