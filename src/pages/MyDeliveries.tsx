import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const MyDeliveries = () => {
  const { user } = useUser();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDelivery, setProcessingDelivery] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeliveries = async () => {
      if (!user) return;

      try {
        // Get delivery partner's ID from Supabase
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", user.id)
          .single();

        if (userError || !userData) {
          console.error("Error fetching user:", userError);
          return;
        }

        // Fetch active deliveries for this delivery partner
        const { data, error } = await supabase
          .from("deliveries")
          .select(`
            id, 
            status, 
            created_at, 
            delivered_at,
            orders (
              id, 
              total_amount, 
              items, 
              users (
                first_name, 
                last_name
              )
            )
          `)
          .eq("delivery_partner_id", userData.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching deliveries:", error);
          return;
        }

        setDeliveries(data || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();

    // Set up real-time subscription for deliveries
    const deliveriesSubscription = supabase
      .channel("deliveries-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deliveries" },
        (payload) => {
          // Refresh deliveries on any change
          fetchDeliveries();
        }
      )
      .subscribe();

    return () => {
      deliveriesSubscription.unsubscribe();
    };
  }, [user]);

  const completeDelivery = async (deliveryId: string) => {
    setProcessingDelivery(deliveryId);

    try {
      // Update delivery status to completed
      const { data, error } = await supabase
        .from("deliveries")
        .update({
          status: "completed",
          delivered_at: new Date().toISOString(),
        })
        .eq("id", deliveryId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update order status
      await supabase
        .from("orders")
        .update({
          status: "delivered",
        })
        .eq("id", data.order_id);

      // Add earnings (in a real app, you would calculate this based on distance, time, etc.)
      const earning = 5000; // ₹50.00 (in paise)

      // Add delivery earnings record
      await supabase.from("delivery_earnings").insert([
        {
          delivery_partner_id: data.delivery_partner_id,
          order_id: data.order_id,
          earning: earning,
        },
      ]);

      // Update wallet balance
      await supabase.rpc("update_wallet_balance", {
        user_id_input: data.delivery_partner_id,
        amount: earning,
      });

      toast.success("Delivery completed successfully!");

      // Update local state
      setDeliveries((prev) =>
        prev.map((delivery) =>
          delivery.id === deliveryId
            ? {
                ...delivery,
                status: "completed",
                delivered_at: new Date().toISOString(),
              }
            : delivery
        )
      );
    } catch (error) {
      console.error("Error completing delivery:", error);
      toast.error("Failed to complete delivery. Please try again.");
    } finally {
      setProcessingDelivery(null);
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

  // Filter deliveries
  const activeDeliveries = deliveries.filter(
    (delivery) => delivery.status === "accepted"
  );
  const completedDeliveries = deliveries.filter(
    (delivery) => delivery.status === "completed"
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Deliveries</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-medium mb-2">No deliveries yet</h2>
          <p className="text-muted-foreground mb-6">
            You haven't accepted any deliveries yet. Check available deliveries to get started!
          </p>
          <Button className="bg-hungryaf-primary hover:bg-hungryaf-primary/90">
            Find Deliveries
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="active">
              Active ({activeDeliveries.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedDeliveries.length})
            </TabsTrigger>
            <TabsTrigger value="all">All ({deliveries.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No active deliveries</p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {activeDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Order #{delivery.orders.id.substring(0, 8)}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {new Date(delivery.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge className="bg-blue-500">In Progress</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pb-0">
                      <div className="mb-3">
                        <p className="text-sm font-medium">
                          Customer: {delivery.orders.users.first_name} {delivery.orders.users.last_name.substring(0, 1)}.
                        </p>
                      </div>

                      <div className="space-y-1 mb-2">
                        {JSON.parse(typeof delivery.orders.items === 'string' ? delivery.orders.items : JSON.stringify(delivery.orders.items))
                          .slice(0, 3)
                          .map((item: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {item.quantity} x {item.name}
                              </span>
                            </div>
                          ))}

                        {JSON.parse(typeof delivery.orders.items === 'string' ? delivery.orders.items : JSON.stringify(delivery.orders.items)).length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            + {JSON.parse(typeof delivery.orders.items === 'string' ? delivery.orders.items : JSON.stringify(delivery.orders.items)).length - 3} more items
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>{formatPrice(delivery.orders.total_amount)}</span>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-4">
                      <Button
                        className="w-full bg-green-500 hover:bg-green-600"
                        onClick={() => completeDelivery(delivery.id)}
                        disabled={processingDelivery === delivery.id}
                      >
                        {processingDelivery === delivery.id
                          ? "Processing..."
                          : "Mark as Delivered"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedDeliveries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No completed deliveries</p>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {completedDeliveries.map((delivery) => (
                  <Card key={delivery.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Order #{delivery.orders.id.substring(0, 8)}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">
                            Delivered: {new Date(delivery.delivered_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge className="bg-green-500">Completed</Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pb-0">
                      <div className="mb-3">
                        <p className="text-sm font-medium">
                          Customer: {delivery.orders.users.first_name} {delivery.orders.users.last_name.substring(0, 1)}.
                        </p>
                      </div>

                      <div className="space-y-1 mb-2">
                        {JSON.parse(typeof delivery.orders.items === 'string' ? delivery.orders.items : JSON.stringify(delivery.orders.items))
                          .slice(0, 3)
                          .map((item: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>
                                {item.quantity} x {item.name}
                              </span>
                            </div>
                          ))}
                      </div>

                      <div className="flex justify-between font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>{formatPrice(delivery.orders.total_amount)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="all">
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {deliveries.map((delivery) => (
                <Card key={delivery.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{delivery.orders.id.substring(0, 8)}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {delivery.status === "completed"
                            ? `Delivered: ${new Date(delivery.delivered_at).toLocaleString()}`
                            : `Accepted: ${new Date(delivery.created_at).toLocaleString()}`}
                        </p>
                      </div>
                      <Badge
                        className={
                          delivery.status === "completed"
                            ? "bg-green-500"
                            : "bg-blue-500"
                        }
                      >
                        {delivery.status === "completed" ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="mb-3">
                      <p className="text-sm font-medium">
                        Customer: {delivery.orders.users.first_name} {delivery.orders.users.last_name.substring(0, 1)}.
                      </p>
                    </div>

                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>{formatPrice(delivery.orders.total_amount)}</span>
                    </div>
                  </CardContent>

                  {delivery.status === "accepted" && (
                    <CardFooter>
                      <Button
                        className="w-full bg-green-500 hover:bg-green-600"
                        onClick={() => completeDelivery(delivery.id)}
                        disabled={processingDelivery === delivery.id}
                      >
                        {processingDelivery === delivery.id
                          ? "Processing..."
                          : "Mark as Delivered"}
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MyDeliveries;
