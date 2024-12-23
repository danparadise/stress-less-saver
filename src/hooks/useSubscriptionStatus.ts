import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSubscriptionStatus = () => {
  return useQuery({
    queryKey: ["subscription-status"],
    queryFn: async () => {
      // First check local profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", user.id)
        .single();

      // If profile shows as pro, verify with Stripe
      if (profile?.subscription_status === 'pro') {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('Error checking subscription:', error);
          throw error;
        }

        // If Stripe says not subscribed, update profile
        if (!data.subscribed) {
          await supabase
            .from("profiles")
            .update({ subscription_status: 'free' })
            .eq("id", user.id);
          
          return { subscription_status: 'free' };
        }
      }
      
      return profile;
    },
  });
};