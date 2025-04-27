
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import AuthForm from "@/components/auth/AuthForm";

const Home = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [isLoading, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-hungryaf-primary/10 to-hungryaf-secondary/10 px-4 py-20 md:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Hungry<span className="text-hungryaf-primary">AF</span> Express Eats
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-700 dark:text-gray-300">
            Food delivery for college students, by college students.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="max-w-md mx-auto bg-white dark:bg-card shadow-xl rounded-xl overflow-hidden"
        >
          <AuthForm />
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4 bg-white dark:bg-background">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="hungryaf-card p-6"
            >
              <div className="h-12 w-12 rounded-full bg-hungryaf-primary/20 flex items-center justify-center mb-4 mx-auto">
                <ShoppingCart className="h-6 w-6 text-hungryaf-primary" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Order Food</h3>
              <p className="text-muted-foreground text-center">
                Browse our menu and order your favorite meals with just a few clicks.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="hungryaf-card p-6"
            >
              <div className="h-12 w-12 rounded-full bg-hungryaf-primary/20 flex items-center justify-center mb-4 mx-auto">
                <Package className="h-6 w-6 text-hungryaf-primary" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Track Orders</h3>
              <p className="text-muted-foreground text-center">
                Real-time updates on your order status from preparation to delivery.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="hungryaf-card p-6"
            >
              <div className="h-12 w-12 rounded-full bg-hungryaf-primary/20 flex items-center justify-center mb-4 mx-auto">
                <Menu className="h-6 w-6 text-hungryaf-primary" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Deliver & Earn</h3>
              <p className="text-muted-foreground text-center">
                Become a delivery partner and earn money by delivering orders.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} HungryAF Express Eats. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const ShoppingCart = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

const Package = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m12 3-8 4.5v9L12 21l8-4.5v-9L12 3" />
    <path d="M12 12v9" />
    <path d="m7 8 10 6" />
    <path d="M12 12 2 6.5" />
    <path d="m17 8-10 6" />
    <path d="M12 12l10-5.5" />
  </svg>
);

const Menu = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="20" y1="6" y2="6" />
    <line x1="4" x2="20" y1="18" y2="18" />
  </svg>
);

export default Home;
