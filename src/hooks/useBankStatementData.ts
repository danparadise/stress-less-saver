import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useBankStatementData = () => {
  return useQuery({
    queryKey: ["latest-bank-statement"],
    queryFn: async () => {
      console.log('Fetching latest bank statement data');
      
      // First try to get data from monthly_financial_summaries
      const { data: summaryData, error: summaryError } = await supabase
        .from("monthly_financial_summaries")
        .select("*")
        .order('month_year', { ascending: false })
        .limit(1)
        .single();

      if (summaryData) {
        console.log('Found monthly summary data:', summaryData);
        return {
          transactions: summaryData.transactions,
          statement_month: summaryData.month_year,
          total_deposits: summaryData.total_deposits,
          total_withdrawals: summaryData.total_withdrawals,
          ending_balance: summaryData.ending_balance,
          financial_documents: {
            status: 'completed',
            upload_date: summaryData.updated_at
          }
        };
      }

      // Fallback to bank_statement_data if no summary exists
      const { data, error } = await supabase
        .from("bank_statement_data")
        .select(`
          transactions,
          statement_month,
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
    }
  });
};