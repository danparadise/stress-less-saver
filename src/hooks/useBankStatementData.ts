import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BankStatement, MonthlyFinancialSummary, FinancialData } from "@/types/bankStatement";

export const useBankStatementData = () => {
  return useQuery({
    queryKey: ["latest-monthly-summary"],
    queryFn: async () => {
      console.log('Fetching latest bank statement data');
      
      // First try to get the latest bank statement
      const { data: statementData, error: statementError } = await supabase
        .from("bank_statement_data")
        .select(`
          *,
          financial_documents!inner(
            status,
            upload_date,
            file_name
          )
        `)
        .eq('financial_documents.status', 'completed')
        .order('statement_month', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (statementError) {
        console.error('Error fetching bank statement:', statementError);
        throw statementError;
      }

      if (statementData) {
        console.log('Found latest bank statement:', statementData);
        return statementData as BankStatement;
      }

      // Fallback to monthly summary if no bank statement exists
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

      console.log('Found monthly summary data:', summaryData);
      return summaryData as MonthlyFinancialSummary;
    },
    refetchOnWindowFocus: true,
    staleTime: 0
  });
};