
import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EarningsTracker from "@/components/EarningsTracker";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user } = useUser();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserRole = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select("role")
          .eq("clerk_user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error);
          return;
        }

        setUserRole(data?.role || null);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    getUserRole();
  }, [user]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid gap-6">
        {loading ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Fetching your personalized dashboard...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {user?.firstName}!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This is your personalized dashboard for the HungryAF food ordering app.
                  You can {userRole === 'eater' ? 'order food' : 'accept delivery requests'} from here.
                </p>
              </CardContent>
            </Card>
            
            {userRole === 'delivery' && (
              <EarningsTracker />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
