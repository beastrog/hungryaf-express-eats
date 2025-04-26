
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Initialize Supabase client
const supabaseUrl = "your-supabase-url";
const supabaseKey = "your-supabase-anon-key";
const supabase = createClient(supabaseUrl, supabaseKey);

const DeliverPage = () => {
  const { user } = useUser();
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableOrders = async () => {
      try {
        // Get orders that are paid but not yet assigned to a delivery partner
        const { data: orders, error } = await supabase
          .from("orders")
          .select(`
            id, 
            total_amount, 
            status, 
            created_at, 
            items,
            users:user_id (first_name, last_name)
          `)
          .eq("payment_status", "completed")
          .eq("status", "paid")
          .not("id", "in", `(
            select order_id from deliveries
            where status in ('accepted', 'completed')
          )`)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching orders:", error);
          return;
        }

        setAvailableOrders(orders || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableOrders();

    // Set up real-time subscription for orders
    const ordersSubscription = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          // Refresh orders on any change
          fetchAvailableOrders();
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
    };
  }, []);

  const acceptDelivery = async (orderId: string) => {
    if (!user) return;
    
    setProcessingOrder(orderId);

    try {
      // Get delivery partner's ID from Supabase
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", user.id)
        .single();

      if (userError || !userData) {
        toast.error("User not found");
        return;
      }

      // Create delivery record
      const { error } = await supabase
        .from("deliveries")
        .insert([
          {
            order_id: orderId,
            delivery_partner_id: userData.id,
            status: "accepted",
          },
        ]);

      if (error) {
        throw new Error(error.message);
      }

      // Remove the accepted order from the list
      setAvailableOrders((prev) => 
        prev.filter((order) => order.id !== orderId)
      );

      toast.success("Delivery accepted!");
    } catch (error) {
      console.error("Error accepting delivery:", error);
      toast.error("Failed to accept delivery. Please try again.");
    } finally {
      setProcessingOrder(null);
    }
  };

  // Format price from cents to dollars/rupees
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Available Deliveries</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : availableOrders.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-medium mb-2">No deliveries available</h2>
          <p className="text-muted-foreground mb-6">
            There are no orders waiting for delivery right now. Check back later!
          </p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {availableOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.id.substring(0, 8)}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
                    Ready for Pickup
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-0">
                <div className="mb-3">
                  <p className="text-sm font-medium">
                    Customer: {order.users.first_name} {order.users.last_name.substring(0, 1)}.
                  </p>
                </div>
                
                <div className="space-y-1 mb-2">
                  {JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items))
                    .slice(0, 3)
                    .map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity} x {item.name}
                        </span>
                      </div>
                    ))}

                  {JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items)).length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      + {JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items)).length - 3} more items
                    </div>
                  )}
                </div>

                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  className="w-full bg-hungryaf-primary hover:bg-hungryaf-primary/90"
                  onClick={() => acceptDelivery(order.id)}
                  disabled={processingOrder === order.id}
                >
                  {processingOrder === order.id ? "Accepting..." : "Accept Delivery"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default DeliverPage;
