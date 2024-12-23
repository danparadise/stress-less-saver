import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const SubscriptionButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Query to get user's subscription status
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", user.id)
        .single();
      
      return profile;
    },
  });

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.functions.invoke('cancel-subscription');
      if (error) throw error;
      
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled successfully",
      });
    } catch (error) {
      console.error('Cancellation error:', error);
      toast({
        title: "Cancellation Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication required",
          description: "Please log in to subscribe",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {},
      });

      if (error) throw error;
      if (!data.url) throw new Error('No checkout URL received');

      window.location.href = data.url;
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to start subscription process",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If user is pro, show cancel button, otherwise show upgrade button
  if (profile?.subscription_status === 'pro') {
    return (
      <Button 
        onClick={handleCancelSubscription} 
        disabled={isLoading}
        variant="outline"
        className="border-red-200 text-red-700 hover:bg-red-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Cancel Subscription'
        )}
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleSubscribe} 
      disabled={isLoading}
      className="bg-purple-600 hover:bg-purple-700"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Upgrade to Pro'
      )}
    </Button>
  );
};

export default SubscriptionButton;