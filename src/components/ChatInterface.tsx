
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase, ChatMessage } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatInterfaceProps {
  orderId: string;
  recipientId?: string;
  orderUserId: string;
  deliveryPartnerId?: string | null;
}

const ChatInterface = ({
  orderId,
  orderUserId,
  deliveryPartnerId
}: ChatInterfaceProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages and set up real-time subscription
  useEffect(() => {
    if (!orderId || !user) return;

    const fetchMessages = async () => {
      try {
        // Using raw SQL query since types don't match yet
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*, user:sender_id(first_name, last_name)')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true }) as unknown as { 
            data: ChatMessage[] | null; 
            error: any;
          };

        if (error) {
          console.error("Error fetching messages:", error);
          toast.error("Could not load chat messages");
          return;
        }

        setMessages(data || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`order-chat-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `order_id=eq.${orderId}`
        },
        async (payload) => {
          console.log("New message:", payload);
          // Fetch user details for the new message
          const { data: userData } = await supabase
            .from("users")
            .select("first_name, last_name")
            .eq("id", payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            user: userData
          } as ChatMessage;
          
          setMessages(prev => [...prev, newMessage]);

          // Mark message as read if it's not from current user
          if (payload.new.sender_id !== user.id) {
            await supabase
              .from('chat_messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', payload.new.id) as unknown as { data: any; error: any; };
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, user]);

  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user) return;
    
    setSending(true);
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          order_id: orderId,
          sender_id: user.id,
          message: newMessage.trim()
        }) as unknown as { data: any; error: any; };

      if (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message");
        return;
      }

      setNewMessage("");
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Get initial for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  if (!deliveryPartnerId && orderUserId !== user?.id) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Chat will be available once a delivery partner accepts your order.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px] border rounded-md overflow-hidden">
      {/* Chat Header */}
      <div className="bg-hungryaf-primary/10 p-3 border-b">
        <h3 className="font-semibold">Order Chat</h3>
        <p className="text-xs text-muted-foreground">
          {deliveryPartnerId 
            ? "Chat with your delivery partner" 
            : "Your delivery partner will appear here"}
        </p>
      </div>
      
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader className="h-8 w-8 animate-spin text-hungryaf-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-center text-muted-foreground">
            <p>No messages yet. Send a message to start the conversation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender_id === user?.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex ${
                    msg.sender_id === user?.id ? "flex-row-reverse" : "flex-row"
                  } gap-2 max-w-[80%]`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={msg.sender_id === user?.id ? "bg-hungryaf-primary" : "bg-gray-500"}>
                      {msg.user ? getInitials(msg.user.first_name, msg.user.last_name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div
                      className={`rounded-lg p-3 ${
                        msg.sender_id === user?.id
                          ? "bg-hungryaf-primary text-white"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      <p>{msg.message}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(msg.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={endOfMessagesRef} />
          </div>
        )}
      </ScrollArea>
      
      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t p-2 flex gap-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending || !deliveryPartnerId}
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={sending || !newMessage.trim() || !deliveryPartnerId}
          className={sending ? "opacity-50" : ""}
        >
          {sending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};

export default ChatInterface;
