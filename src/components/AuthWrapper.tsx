
import { useUser } from "@clerk/clerk-react";
import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Loader } from "lucide-react";

// Initialize Supabase client
const supabaseUrl = "your-supabase-url";
const supabaseKey = "your-supabase-anon-key";
const supabase = createClient(supabaseUrl, supabaseKey);

interface AuthWrapperProps {
  children: ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isUserRegistered, setIsUserRegistered] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (!isLoaded || !isSignedIn) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if user exists in our database
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", user.id)
          .single();

        if (error || !data) {
          // User doesn't exist, create new user record
          const { data: newUser, error: createError } = await supabase
            .from("users")
            .insert([
              {
                clerk_user_id: user.id,
                first_name: user.firstName || "",
                last_name: user.lastName || "",
                role: "eater", // Default role
              },
            ])
            .select()
            .single();

          if (createError) {
            console.error("Error creating user:", createError);
            setIsUserRegistered(false);
          } else {
            console.log("Created new user:", newUser);
            setIsUserRegistered(true);
          }
        } else {
          // User exists
          setIsUserRegistered(true);
        }
      } catch (err) {
        console.error("Error checking user:", err);
        setIsUserRegistered(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-hungryaf-primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  if (isUserRegistered === false) {
    // There was an error registering the user
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Registration Error</h1>
          <p className="mt-2">
            There was a problem registering your account. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-hungryaf-primary px-4 py-2 text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthWrapper;
