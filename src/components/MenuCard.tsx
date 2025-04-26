
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MenuCardProps {
  item: {
    id: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
  };
  onAddToCart: () => void;
}

const MenuCard = ({ item, onAddToCart }: MenuCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAddToCart = () => {
    setIsAdding(true);
    onAddToCart();
    
    // Reset button state after animation
    setTimeout(() => {
      setIsAdding(false);
    }, 500);
  };
  
  const formatPrice = (price: number) => {
    // Convert price from cents to dollars/rupees
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };
  
  return (
    <div className="hungryaf-card h-full flex flex-col">
      <div className="relative h-40 bg-gray-200 dark:bg-gray-800">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
            <span className="text-4xl">🍔</span>
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-1">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-muted-foreground mb-4 flex-1">
            {item.description}
          </p>
        )}
        
        <div className="flex justify-between items-center mt-auto">
          <span className="font-bold text-lg">
            {formatPrice(item.price)}
          </span>
          
          <motion.div
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={handleAddToCart}
              className={cn(
                "bg-hungryaf-primary hover:bg-hungryaf-primary/90 text-white",
                isAdding && "bg-green-600 hover:bg-green-600"
              )}
              disabled={isAdding}
            >
              {isAdding ? "Added! ✓" : "Add to Cart"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
