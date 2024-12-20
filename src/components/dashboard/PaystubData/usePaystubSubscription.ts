import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePaystubSubscription = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up real-time subscriptions for paystubs');
    
    // Force an immediate invalidation when subscription is set up
    queryClient.invalidateQueries({ queryKey: ["paystub-data"] });
    
    const channel = supabase
      .channel('paystub-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'paystub_data'
        },
        (payload) => {
          console.log('Paystub data changed:', payload);
          queryClient.invalidateQueries({ queryKey: ["paystub-data"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_documents'
        },
        (payload) => {
          console.log('Financial document changed:', payload);
          queryClient.invalidateQueries({ queryKey: ["paystub-data"] });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          // Force a refresh when subscription is established
          queryClient.invalidateQueries({ queryKey: ["paystub-data"] });
        }
      });

    return () => {
      console.log('Cleaning up paystub subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};