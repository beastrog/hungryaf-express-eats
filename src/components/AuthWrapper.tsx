
import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface AuthWrapperProps {
  children: ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { user, isLoading } = useAuth();
  const [isUserRegistered, setIsUserRegistered] = useState<boolean | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (isLoading || !user) {
        setCheckingUser(false);
        return;
      }

      try {
        // Check if user exists in our database
        const { data, error } = await supabase
          .from("users")
          .select("id, role")
          .eq("id", user.id)
          .single();

        if (error || !data) {
          console.error("Error checking user:", error);
          setIsUserRegistered(false);
        } else {
          console.log("User found:", data);
          setIsUserRegistered(true);
        }
      } catch (err) {
        console.error("Error checking user:", err);
        setIsUserRegistered(false);
        toast.error("Failed to validate user profile. Please try again.");
      } finally {
        setCheckingUser(false);
      }
    };

    checkUser();
  }, [isLoading, user]);

  if (isLoading || checkingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-hungryaf-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isUserRegistered === false) {
    // There was an error finding the user record
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Registration Error</h1>
          <p className="mt-2">
            There was a problem with your account. Please try signing out and back in.
          </p>
          <button
            onClick={() => {
              supabase.auth.signOut().then(() => {
                window.location.href = "/";
              });
            }}
            className="mt-4 rounded bg-hungryaf-primary px-4 py-2 text-white"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthWrapper;
