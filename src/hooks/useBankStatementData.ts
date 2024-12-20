import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BankStatement, Transaction } from "@/types/bankStatement";

export const useBankStatementData = () => {
  return useQuery({
    queryKey: ["latest-monthly-summary"],
    queryFn: async () => {
      console.log('Fetching latest bank statement data');
      
      const { data: statements, error: statementError } = await supabase
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
        .order('statement_month', { ascending: false });

      if (statementError) {
        console.error('Error fetching bank statement:', statementError);
        throw statementError;
      }

      // Get the most recent statement
      const latestStatement = statements && statements.length > 0 ? statements[0] : null;

      if (latestStatement) {
        console.log('Found latest bank statement:', latestStatement);
        
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
        } as BankStatement;
      }

      return null;
    },
    refetchOnWindowFocus: true,
    staleTime: 0
  });
};