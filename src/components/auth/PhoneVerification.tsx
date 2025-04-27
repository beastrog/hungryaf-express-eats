
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "lucide-react";

interface PhoneVerificationProps {
  onComplete?: () => void;
}

const PhoneVerification = ({ onComplete }: PhoneVerificationProps) => {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  // Check if phone is already verified
  useEffect(() => {
    const checkPhoneVerification = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("users")
          .select("phone_number, phone_verified")
          .eq("id", user.id)
          .single();
          
        if (error) {
          console.error("Error checking phone verification:", error);
          return;
        }
        
        if (data?.phone_verified) {
          setIsVerified(true);
          if (data.phone_number) {
            setPhone(data.phone_number);
          }
        }
      } catch (err) {
        console.error("Error:", err);
      }
    };
    
    checkPhoneVerification();
  }, [user]);
  
  const sendVerification = async () => {
    if (!user) return;
    
    if (!phone || !phone.match(/^\+[1-9]\d{1,14}$/)) {
      toast.error("Please enter a valid phone number with country code (e.g. +917123456789)");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call an edge function to send the SMS
      // For now, we'll simulate the verification process
      
      // Update user's phone number in the database
      const { error } = await supabase
        .from("users")
        .update({ phone_number: phone })
        .eq("id", user.id);
        
      if (error) {
        throw new Error("Failed to update phone number");
      }
      
      // Simulate sending OTP
      setTimeout(() => {
        setVerificationSent(true);
        toast.success("Verification code sent to your phone number");
        setIsLoading(false);
      }, 1500);
      
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to send verification code");
      setIsLoading(false);
    }
  };
  
  const verifyOtp = async () => {
    if (!user || !otp) return;
    
    setIsLoading(true);
    
    try {
      // In a real implementation, this would validate the OTP with an edge function
      // For demo purposes, any 6-digit OTP will work
      if (otp.length !== 6) {
        throw new Error("Please enter a valid 6-digit code");
      }
      
      // Simulate OTP verification
      setTimeout(async () => {
        // Update verification status in the database
        const { error } = await supabase
          .from("users")
          .update({ phone_verified: true })
          .eq("id", user.id);
          
        if (error) {
          throw new Error("Failed to update verification status");
        }
        
        setIsVerified(true);
        toast.success("Phone number verified successfully");
        if (onComplete) onComplete();
        setIsLoading(false);
      }, 1500);
      
    } catch (err: any) {
      console.error("Error:", err);
      toast.error(err.message || "Verification failed");
      setIsLoading(false);
    }
  };
  
  if (isVerified) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center text-center">
            <div>
              <div className="rounded-full bg-green-100 p-3 text-green-600 dark:bg-green-700/20 dark:text-green-50 mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              </div>
              <h3 className="text-lg font-medium">Phone Number Verified</h3>
              <p className="text-sm text-muted-foreground mt-2">{phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Phone Verification</CardTitle>
        <CardDescription>
          Verify your phone number to enhance account security and receive order updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!verificationSent ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+917123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Enter your phone number with country code
              </p>
            </div>
            <Button
              onClick={sendVerification}
              className="w-full bg-hungryaf-primary hover:bg-hungryaf-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to {phone}
              </p>
            </div>
            <Button
              onClick={verifyOtp}
              className="w-full bg-hungryaf-primary hover:bg-hungryaf-primary/90"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setVerificationSent(false)}
                disabled={isLoading}
              >
                Change phone number
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-xs text-muted-foreground">
          Standard SMS rates may apply.
        </p>
      </CardFooter>
    </Card>
  );
};

export default PhoneVerification;
