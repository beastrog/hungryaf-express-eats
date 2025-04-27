import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Check, Edit, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

// Define form schema for menu items
const menuItemSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  price: z.coerce.number().min(1, { message: "Price must be at least 1" }),
  available: z.boolean().default(true),
});

const AdminDashboard = () => {
  const { user } = useUser();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const form = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      available: true,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch menu items
        const { data: menu, error: menuError } = await supabase
          .from("menu")
          .select("*")
          .order("name");

        if (menuError) {
          console.error("Error fetching menu:", menuError);
        } else {
          setMenuItems(menu || []);
        }

        // Fetch recent orders
        const { data: recentOrders, error: ordersError } = await supabase
          .from("orders")
          .select(`
            *,
            users (first_name, last_name),
            deliveries (id, status, delivery_partner_id)
          `)
          .order("created_at", { ascending: false })
          .limit(10);

        if (ordersError) {
          console.error("Error fetching orders:", ordersError);
        } else {
          setOrders(recentOrders || []);
        }

        // Fetch active deliveries
        const { data: activeDeliveries, error: deliveriesError } = await supabase
          .from("deliveries")
          .select(`
            *,
            users:delivery_partner_id (first_name, last_name),
            orders (id, total_amount, user_id)
          `)
          .eq("status", "accepted")
          .order("created_at", { ascending: false });

        if (deliveriesError) {
          console.error("Error fetching deliveries:", deliveriesError);
        } else {
          setDeliveries(activeDeliveries || []);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const ordersSubscription = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          // Refresh data on any change
          fetchData();
        }
      )
      .subscribe();

    const menuSubscription = supabase
      .channel("menu-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu" },
        (payload) => {
          fetchData();
        }
      )
      .subscribe();

    const deliveriesSubscription = supabase
      .channel("deliveries-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deliveries" },
        (payload) => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      ordersSubscription.unsubscribe();
      menuSubscription.unsubscribe();
      deliveriesSubscription.unsubscribe();
    };
  }, []);

  const handleEdit = (item: any) => {
    form.reset({
      name: item.name,
      description: item.description || "",
      price: item.price / 100, // Convert from cents to display value
      available: item.available,
    });
    setEditingItem(item.id);
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    form.reset({
      name: "",
      description: "",
      price: 0,
      available: true,
    });
    setEditingItem(null);
    setIsAddingNew(true);
  };

  const handleCancel = () => {
    setEditingItem(null);
    setIsAddingNew(false);
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from("menu").delete().eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      // Remove from local state
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Menu item deleted successfully!");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete menu item.");
    }
  };

  const onSubmit = async (data: z.infer<typeof menuItemSchema>) => {
    try {
      // Convert price to cents for storage
      const priceInCents = Math.round(data.price * 100);
      
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("menu")
          .update({
            name: data.name,
            description: data.description,
            price: priceInCents,
            available: data.available,
          })
          .eq("id", editingItem);

        if (error) {
          throw new Error(error.message);
        }

        toast.success("Menu item updated successfully!");
      } else {
        // Add new item
        const { error } = await supabase.from("menu").insert([
          {
            name: data.name,
            description: data.description,
            price: priceInCents,
            available: data.available,
          },
        ]);

        if (error) {
          throw new Error(error.message);
        }

        toast.success("Menu item added successfully!");
      }

      // Reset form and state
      setEditingItem(null);
      setIsAddingNew(false);
    } catch (error) {
      console.error("Error saving item:", error);
      toast.error("Failed to save menu item.");
    }
  };

  // Format price from cents to dollars/rupees
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="menu" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="menu">Menu Management</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
        </TabsList>

        {/* Menu Management Tab */}
        <TabsContent value="menu">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Menu Items</h2>
            {!isAddingNew && !editingItem && (
              <Button 
                onClick={handleAddNew}
                className="bg-hungryaf-primary hover:bg-hungryaf-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Item
              </Button>
            )}
          </div>

          {/* Add/Edit Form */}
          {(isAddingNew || editingItem) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingItem ? "Edit Item" : "Add New Item"}</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Item name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Item description (optional)" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              placeholder="0.00" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="available"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Available</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Make this item available on the menu
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-hungryaf-primary hover:bg-hungryaf-primary/90"
                      >
                        {editingItem ? "Update Item" : "Add Item"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {/* Menu Items List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-6 w-1/3 rounded bg-muted"></div>
                    <div className="h-4 w-1/4 rounded bg-muted"></div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="h-4 w-2/3 rounded bg-muted mb-2"></div>
                    <div className="h-4 w-1/2 rounded bg-muted"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-medium mb-2">No menu items</h2>
              <p className="text-muted-foreground mb-6">
                Add your first menu item to get started!
              </p>
              <Button 
                onClick={handleAddNew}
                className="bg-hungryaf-primary hover:bg-hungryaf-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {menuItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {formatPrice(item.price)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <div className="flex items-center">
                      <div
                        className={`mr-2 h-3 w-3 rounded-full ${
                          item.available ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span className="text-sm">
                        {item.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Recent Orders</h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-6 w-1/3 rounded bg-muted"></div>
                    <div className="h-4 w-1/4 rounded bg-muted"></div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="h-4 w-2/3 rounded bg-muted mb-2"></div>
                    <div className="h-4 w-1/2 rounded bg-muted"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-medium mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">
                Orders will appear here when customers place them
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.id.substring(0, 8)}
                        </CardTitle>
                        <CardDescription>
                          {new Date(order.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                            : order.status === "paid"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100"
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span>
                          {order.users?.first_name} {order.users?.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-bold">{formatPrice(order.total_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Status:</span>
                        <span className={`${
                          order.payment_status === "completed"
                            ? "text-green-600 dark:text-green-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}>
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Status:</span>
                        <span>
                          {order.deliveries && order.deliveries[0]
                            ? order.deliveries[0].status.charAt(0).toUpperCase() + order.deliveries[0].status.slice(1)
                            : "Waiting for Assignment"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Deliveries Tab */}
        <TabsContent value="deliveries">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Active Deliveries</h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-6 w-1/3 rounded bg-muted"></div>
                    <div className="h-4 w-1/4 rounded bg-muted"></div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="h-4 w-2/3 rounded bg-muted mb-2"></div>
                    <div className="h-4 w-1/2 rounded bg-muted"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-medium mb-2">No active deliveries</h2>
              <p className="text-muted-foreground mb-6">
                Active deliveries will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <Card key={delivery.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{delivery.order_id.substring(0, 8)}
                        </CardTitle>
                        <CardDescription>
                          {new Date(delivery.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                          In Progress
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Delivery Partner:</span>
                        <span>
                          {delivery.users?.first_name} {delivery.users?.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Order Amount:</span>
                        <span className="font-bold">{formatPrice(delivery.orders?.total_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Status:</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
