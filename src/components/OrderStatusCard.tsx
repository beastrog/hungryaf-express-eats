
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import OrderDetailsDialog from "@/components/OrderDetailsDialog";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderStatusCardProps {
  order: {
    id: string;
    items: any[];
    total_amount: number;
    status: "placed" | "paid" | "delivered";
    payment_status: "pending" | "completed";
    created_at: string;
    deliveries?: {
      id: string;
      status: "pending" | "accepted" | "completed";
      delivery_partner_id: string;
    }[];
  };
}

const OrderStatusCard = ({ order }: OrderStatusCardProps) => {
  const [timeAgo, setTimeAgo] = useState(() => {
    // Calculate time ago on first render
    const date = new Date(order.created_at);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    if (days < 30) return `${days} days ago`;
    
    return format(date, "MMM d, yyyy");
  });
  
  // Format price from cents to INR
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };
  
  // Determine overall status
  const getOverallStatus = () => {
    const deliveryStatus = order.deliveries?.[0]?.status || "pending";
    
    if (order.status === "delivered" || deliveryStatus === "completed") {
      return { text: "Delivered", color: "bg-green-500" };
    }
    
    if (order.payment_status === "completed" && deliveryStatus === "accepted") {
      return { text: "On the way", color: "bg-blue-500" };
    }
    
    if (order.payment_status === "completed" && deliveryStatus === "pending") {
      return { text: "Preparing", color: "bg-amber-500" };
    }
    
    if (order.status === "paid" || order.payment_status === "completed") {
      return { text: "Paid", color: "bg-blue-500" };
    }
    
    return { text: "Placed", color: "bg-amber-500" };
  };
  
  const overallStatus = getOverallStatus();
  const hasActiveDelivery = order.deliveries?.some(d => d.status === "accepted") || false;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              Order #{order.id.substring(0, 8)}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <Badge className={overallStatus.color}>
            {overallStatus.text}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-1 mb-2">
          {JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items))
            .slice(0, 2)
            .map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.quantity} x {item.name}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          
          {JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items)).length > 2 && (
            <div className="text-xs text-muted-foreground">
              + {JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items)).length - 2} more items
            </div>
          )}
        </div>
        
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>{formatPrice(order.total_amount)}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="grid grid-cols-2 gap-2 w-full">
          <OrderDetailsDialog 
            orderId={order.id}
            trigger={
              <Button variant="outline" className="w-full" size="sm">
                View Details
              </Button>
            }
          />
          
          <OrderDetailsDialog 
            orderId={order.id}
            trigger={
              <Button 
                variant="outline" 
                className={cn(
                  "w-full", 
                  hasActiveDelivery ? "bg-green-50 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800" : "text-muted-foreground"
                )}
                size="sm"
                disabled={!hasActiveDelivery}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Chat
                {hasActiveDelivery && (
                  <span className="ml-1 h-2 w-2 rounded-full bg-green-500"></span>
                )}
              </Button>
            }
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default OrderStatusCard;
