
import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface PaymentProcessingProps {
  orderId: string;
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PaymentProcessingComponent = ({ 
  orderId, 
  amount, 
  onSuccess,
  onCancel 
}: PaymentProcessingProps) => {
  const { user } = useUser();
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  // Format price from cents to dollars/rupees
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const calculateFees = () => {
    // Calculate platform fee (5%)
    const platformFee = Math.round(amount * 0.05);
    
    // Calculate delivery fee (flat fee)
    const deliveryFee = 5000; // ₹50.00 in paise
    
    // Calculate tax (18% GST)
    const tax = Math.round((amount + platformFee + deliveryFee) * 0.18);
    
    return {
      subtotal: amount,
      platformFee,
      deliveryFee,
      tax,
      total: amount + platformFee + deliveryFee + tax
    };
  };

  const fees = calculateFees();

  const handleProcessPayment = async () => {
    if (!user) return;
    
    setProcessing(true);
    
    try {
      // In a real app, we would integrate with an actual payment gateway here
      // For now, we'll simulate a successful payment after a short delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update order status and payment status
      const { error } = await supabase
        .from("orders")
        .update({
          status: "paid",
          payment_status: "completed",
          total_amount: fees.total, // Update with the final amount including fees
        })
        .eq("id", orderId);

      if (error) {
        throw new Error(error.message);
      }

      toast.success("Payment successful!");
      
      if (onSuccess) {
        onSuccess();
      } else {
        // Default navigation to order details
        navigate(`/dashboard/my-orders`);
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Payment failed. Please try again.");
      
      if (onCancel) {
        onCancel();
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Order Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(fees.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Platform Fee (5%)</span>
            <span>{formatPrice(fees.platformFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Delivery Fee</span>
            <span>{formatPrice(fees.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (18% GST)</span>
            <span>{formatPrice(fees.tax)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>{formatPrice(fees.total)}</span>
          </div>
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md text-xs">
          <p className="text-amber-800 dark:text-amber-200">
            Note: This is a demo payment flow. No real payment will be processed.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          onClick={handleProcessPayment}
          className="w-full bg-hungryaf-primary hover:bg-hungryaf-primary/90"
          disabled={processing}
        >
          {processing ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            `Pay ${formatPrice(fees.total)}`
          )}
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleCancel}
          disabled={processing}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PaymentProcessingComponent;
