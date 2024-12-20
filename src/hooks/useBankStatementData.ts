import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBankStatementData = () => {
  return useQuery({
    queryKey: ["latest-monthly-summary"],
    queryFn: async () => {
      console.log('Fetching latest monthly summary data');
      
      // First try to get the latest monthly summary
      const { data: summaryData, error: summaryError } = await supabase
        .from("monthly_financial_summaries")
        .select("*")
        .order('month_year', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (summaryError) {
        console.error('Error fetching monthly summary:', summaryError);
        throw summaryError;
      }

      if (summaryData) {
        console.log('Found monthly summary data:', summaryData);
        return summaryData;
      }

      console.log('No monthly summary found, falling back to bank statement data');
      
      // Fallback to bank_statement_data if no summary exists
      const { data, error } = await supabase
        .from("bank_statement_data")
        .select(`
          *,
          financial_documents!inner(
            status,
            upload_date
          )
        `)
        .eq('financial_documents.status', 'completed')
        .order('statement_month', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching bank statement data:', error);
        throw error;
      }

      console.log('Fetched bank statement data:', data);
      return data;
    },
    refetchOnWindowFocus: true,
    staleTime: 0
  });
};