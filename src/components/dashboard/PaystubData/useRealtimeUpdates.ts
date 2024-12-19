import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRealtimeUpdates = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up real-time subscriptions');
    
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
      });

    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};