
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import ChatInterface from "./ChatInterface";

interface OrderDetailsDialogProps {
  orderId: string;
  trigger?: React.ReactNode;
}

interface OrderDetails {
  id: string;
  items: any[];
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  address: string;
  notes: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
  };
  deliveries: {
    id: string;
    status: string;
    created_at: string;
    delivered_at: string | null;
    delivery_partner: {
      id: string;
      first_name: string;
      last_name: string;
    } | null;
  }[];
}

const OrderDetailsDialog = ({ orderId, trigger }: OrderDetailsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          user:user_id (id, first_name, last_name),
          deliveries (
            id, 
            status, 
            created_at, 
            delivered_at,
            delivery_partner:delivery_partner_id (id, first_name, last_name)
          )
        `)
        .eq("id", orderId)
        .single();

      if (error) {
        console.error("Error fetching order details:", error);
        return;
      }

      setOrder(data as any);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
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

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "placed":
        return "bg-yellow-500";
      case "paid":
        return "bg-blue-500";
      case "delivered":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "accepted":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">View Details</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="h-8 w-8 animate-spin text-hungryaf-primary" />
          </div>
        ) : !order ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Order details not found</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex justify-between items-center">
                <span>Order #{order.id.substring(0, 8)}</span>
                <Badge className={getStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </DialogTitle>
              <div className="text-sm text-muted-foreground">
                Placed on {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </DialogHeader>

            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="chat">
                  Chat
                  {order.deliveries?.[0]?.status === "accepted" && (
                    <span className="ml-1.5 h-2 w-2 rounded-full bg-green-500"></span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Order Items</h3>
                  <div className="space-y-2">
                    {JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items)).map((item: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span>
                          {item.quantity} × {item.name}
                        </span>
                        <span className="font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />
                  
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Customer</h3>
                  <p>{order.user.first_name} {order.user.last_name}</p>
                </div>
                
                {order.address && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Delivery Address</h3>
                    <p className="whitespace-pre-wrap">{order.address}</p>
                  </div>
                )}
                
                {order.notes && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Order Notes</h3>
                    <p className="whitespace-pre-wrap">{order.notes}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <h3 className="font-medium">Delivery Status</h3>
                  {order.deliveries && order.deliveries.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Status</span>
                        <Badge className={getStatusColor(order.deliveries[0].status)}>
                          {order.deliveries[0].status.charAt(0).toUpperCase() + order.deliveries[0].status.slice(1)}
                        </Badge>
                      </div>
                      
                      {order.deliveries[0].delivery_partner && (
                        <div className="flex justify-between">
                          <span>Delivery Partner</span>
                          <span>{order.deliveries[0].delivery_partner.first_name} {order.deliveries[0].delivery_partner.last_name}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span>Accepted At</span>
                        <span>{format(new Date(order.deliveries[0].created_at), "MMM d, h:mm a")}</span>
                      </div>
                      
                      {order.deliveries[0].delivered_at && (
                        <div className="flex justify-between">
                          <span>Delivered At</span>
                          <span>{format(new Date(order.deliveries[0].delivered_at), "MMM d, h:mm a")}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Waiting for a delivery partner...</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="chat">
                <ChatInterface 
                  orderId={order.id} 
                  orderUserId={order.user.id}
                  deliveryPartnerId={order.deliveries?.[0]?.delivery_partner?.id || null}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailsDialog;
