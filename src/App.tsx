
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useTheme } from "./hooks/use-theme";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import OrderPage from "./pages/Order";
import DeliverPage from "./pages/Deliver";
import MyOrders from "./pages/MyOrders";
import MyDeliveries from "./pages/MyDeliveries";
import AdminDashboard from "./pages/Admin";
import NotFound from "./pages/NotFound";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
import AuthWrapper from "./components/AuthWrapper";

const queryClient = new QueryClient();

// Get publishable key from environment variables
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const App = () => {
  const { theme } = useTheme();

  if (!PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500">Configuration Error</h1>
          <p className="mt-2 text-gray-600">
            Missing Clerk Publishable Key. Check your environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: theme === "dark" ? dark : undefined,
        elements: {
          formButtonPrimary: "bg-hungryaf-primary hover:bg-hungryaf-primary/90",
          footerActionLink: "text-hungryaf-primary hover:text-hungryaf-primary/90"
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={
                <AuthWrapper>
                  <DashboardLayout />
                </AuthWrapper>
              }>
                <Route index element={<Dashboard />} />
                <Route path="order" element={<OrderPage />} />
                <Route path="deliver" element={<DeliverPage />} />
                <Route path="my-orders" element={<MyOrders />} />
                <Route path="my-deliveries" element={<MyDeliveries />} />
                <Route path="admin" element={<AdminDashboard />} />
              </Route>

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default App;
