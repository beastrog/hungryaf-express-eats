
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import PaymentProcessingComponent from "@/components/PaymentProcessingComponent";

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get("orderId");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setError("No order ID provided");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (error) {
          throw error;
        }

        if (data.payment_status === "completed") {
          // Payment already completed, redirect to order details
          navigate(`/dashboard/my-orders`);
          return;
        }

        setOrder(data);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate]);

  const handlePaymentSuccess = () => {
    // Redirect to order details
    navigate(`/dashboard/my-orders`);
  };

  const handlePaymentCancel = () => {
    // Redirect back to orders
    navigate(`/dashboard/order`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader className="h-8 w-8 animate-spin text-hungryaf-primary mb-4" />
        <p className="text-muted-foreground">Loading payment details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-4 max-w-md mx-auto mt-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "Order not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Complete Your Payment</h1>
      <PaymentProcessingComponent 
        orderId={order.id}
        amount={order.total_amount}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    </div>
  );
};

export default PaymentPage;
