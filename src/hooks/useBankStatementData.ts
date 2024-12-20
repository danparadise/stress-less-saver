import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BankStatement, Transaction } from "@/types/bankStatement";

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
        // Convert transactions from Json to Transaction[]
        const typedTransactions = Array.isArray(statementData.transactions) 
          ? statementData.transactions.map((t: any): Transaction => ({
              date: t.date,
              description: t.description,
              category: t.category,
              amount: t.amount,
              balance: t.balance
            }))
          : [];
          
        return {
          ...statementData,
          transactions: typedTransactions
        } as BankStatement;
      }

      return null;
    },
    refetchOnWindowFocus: true,
    staleTime: 0
  });
};