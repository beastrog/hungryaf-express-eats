
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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
  const [timeAgo, setTimeAgo] = useState("");
  
  useEffect(() => {
    // Calculate time ago on first render
    updateTimeAgo();
    
    // Update time ago every minute
    const interval = setInterval(updateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [order.created_at]);
  
  const updateTimeAgo = () => {
    const date = new Date(order.created_at);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) {
      setTimeAgo(`${Math.floor(interval)} years ago`);
      return;
    }
    
    interval = seconds / 2592000;
    if (interval > 1) {
      setTimeAgo(`${Math.floor(interval)} months ago`);
      return;
    }
    
    interval = seconds / 86400;
    if (interval > 1) {
      setTimeAgo(`${Math.floor(interval)} days ago`);
      return;
    }
    
    interval = seconds / 3600;
    if (interval > 1) {
      setTimeAgo(`${Math.floor(interval)} hours ago`);
      return;
    }
    
    interval = seconds / 60;
    if (interval > 1) {
      setTimeAgo(`${Math.floor(interval)} minutes ago`);
      return;
    }
    
    setTimeAgo(`${Math.floor(seconds)} seconds ago`);
  };
  
  // Format price from cents to INR
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "placed":
        return "bg-amber-500";
      case "paid":
        return "bg-blue-500";
      case "delivered":
        return "bg-green-500";
      case "pending":
        return "bg-amber-500";
      case "accepted":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
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
        <Button variant="outline" className="w-full" size="sm">
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OrderStatusCard;
