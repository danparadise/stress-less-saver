import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MonthlyFinancialSummary, Transaction } from "@/types/bankStatement";

export const useBankStatementData = () => {
  return useQuery({
    queryKey: ["latest-monthly-summary"],
    queryFn: async () => {
      console.log('Fetching latest bank statement data');
      
      const { data: statements, error: statementError } = await supabase
        .from("monthly_financial_summaries")
        .select("*")
        .order('month_year', { ascending: false })
        .limit(1);

      if (statementError) {
        console.error('Error fetching monthly summary:', statementError);
        throw statementError;
      }

      console.log('Monthly summary data:', statements);

      const latestStatement = statements && statements.length > 0 ? statements[0] : null;

      if (latestStatement) {
        console.log('Found latest monthly summary:', latestStatement);
        
        // Ensure transactions are properly typed
        const typedTransactions = Array.isArray(latestStatement.transactions) 
          ? latestStatement.transactions.map((t: any): Transaction => ({
              date: t.date,
              description: t.description,
              category: t.category,
              amount: t.amount,
              balance: t.balance
            }))
          : [];
          
        return {
          ...latestStatement,
          transactions: typedTransactions
        } as MonthlyFinancialSummary;
      }

      return null;
    },
    refetchOnWindowFocus: true,
    staleTime: 0
  });
};