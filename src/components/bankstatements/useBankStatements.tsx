import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useBankStatements = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up real-time subscriptions');
    
    const channel = supabase
      .channel('bank-statement-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_statement_data'
        },
        (payload) => {
          console.log('Bank statement data changed:', payload);
          queryClient.invalidateQueries({ queryKey: ["bank-statement-data"] });
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
          queryClient.invalidateQueries({ queryKey: ["bank-statement-data"] });
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

  const { data: statements, isLoading, refetch } = useQuery({
    queryKey: ["bank-statement-data"],
    queryFn: async () => {
      console.log('Fetching bank statement data');
      const { data, error } = await supabase
        .from("bank_statement_data")
        .select(`
          *,
          financial_documents(
            file_name,
            upload_date,
            status,
            id
          )
        `)
        .order("statement_month", { ascending: false });

      if (error) throw error;
      console.log('Fetched bank statement data:', data);
      return data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0
  });

  return { statements, isLoading, refetch };
};