
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTheme } from "./hooks/use-theme";
import { useAuth } from "./hooks/use-auth";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import OrderPage from "./pages/Order";
import DeliverPage from "./pages/Deliver";
import MyOrders from "./pages/MyOrders";
import MyDeliveries from "./pages/MyDeliveries";
import AdminDashboard from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Payment from "./pages/Payment";

// Layouts
import DashboardLayout from "./layouts/DashboardLayout";
import AuthWrapper from "./components/AuthWrapper";

const queryClient = new QueryClient();

const App = () => {
  const { theme } = useTheme();

  return (
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
              <Route path="payment" element={<Payment />} />
            </Route>

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
