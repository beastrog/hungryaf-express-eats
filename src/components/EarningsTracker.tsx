
import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const EarningsTracker = () => {
  const { user } = useUser();
  const [earnings, setEarnings] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
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

        // Get wallet balance
        const { data: walletData, error: walletError } = await supabase
          .from("wallet")
          .select("balance")
          .eq("user_id", userData.id)
          .single();

        // Set total earnings from wallet balance
        if (!walletError && walletData) {
          setTotalEarnings(walletData.balance);
        }

        // Fetch all earnings
        const { data: earningsData, error: earningsError } = await supabase
          .from("delivery_earnings")
          .select("earning, created_at")
          .eq("delivery_partner_id", userData.id)
          .order("created_at", { ascending: false });

        if (earningsError) {
          console.error("Error fetching earnings:", earningsError);
          return;
        }

        setEarnings(earningsData || []);

        // Calculate weekly earnings
        const now = new Date();
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        
        const weekly = earningsData?.reduce((sum, item) => {
          const date = new Date(item.created_at);
          if (date >= weekStart && date <= weekEnd) {
            return sum + item.earning;
          }
          return sum;
        }, 0) || 0;
        
        setWeeklyEarnings(weekly);

        // Calculate monthly earnings
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        
        const monthly = earningsData?.reduce((sum, item) => {
          const date = new Date(item.created_at);
          if (date >= monthStart && date <= monthEnd) {
            return sum + item.earning;
          }
          return sum;
        }, 0) || 0;
        
        setMonthlyEarnings(monthly);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [user]);

  // Format price from cents to dollars/rupees
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  // Prepare data for chart
  const prepareChartData = () => {
    // Group by date
    const dateMap = new Map();
    
    earnings.forEach(item => {
      const date = format(new Date(item.created_at), "MMM d");
      const existing = dateMap.get(date) || 0;
      dateMap.set(date, existing + item.earning);
    });
    
    // Convert to array for chart
    return Array.from(dateMap)
      .slice(0, 7) // Last 7 days with earnings
      .map(([date, amount]) => ({
        date,
        amount: amount / 100, // Convert to rupees for better chart scale
      }))
      .reverse();
  };

  const chartData = prepareChartData();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Earnings Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="total" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="total">Total</TabsTrigger>
                <TabsTrigger value="weekly">This Week</TabsTrigger>
                <TabsTrigger value="monthly">This Month</TabsTrigger>
              </TabsList>
              
              <TabsContent value="total" className="h-20">
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-3xl font-bold">{formatPrice(totalEarnings)}</span>
                  <span className="text-sm text-muted-foreground">Total Earnings</span>
                </div>
              </TabsContent>
              
              <TabsContent value="weekly" className="h-20">
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-3xl font-bold">{formatPrice(weeklyEarnings)}</span>
                  <span className="text-sm text-muted-foreground">This Week</span>
                </div>
              </TabsContent>
              
              <TabsContent value="monthly" className="h-20">
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-3xl font-bold">{formatPrice(monthlyEarnings)}</span>
                  <span className="text-sm text-muted-foreground">This Month</span>
                </div>
              </TabsContent>
            </Tabs>
            
            {chartData.length > 0 ? (
              <div className="h-64">
                <h3 className="text-sm text-muted-foreground mb-2">Recent Earnings (₹)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, "Amount"]} />
                    <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">No recent earnings data to display</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EarningsTracker;
