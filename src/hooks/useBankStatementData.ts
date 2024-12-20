import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/bankStatement";
import { Json } from "@/integrations/supabase/types";

// Helper function to convert Json to Transaction
const convertJsonToTransaction = (jsonData: Json): Transaction => {
  if (typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData)) {
    return {
      date: String(jsonData.date || ''),
      description: String(jsonData.description || ''),
      category: String(jsonData.category || ''),
      amount: Number(jsonData.amount || 0),
      balance: Number(jsonData.balance || 0)
    };
  }
  // Return a default transaction if conversion fails
  return {
    date: '',
    description: '',
    category: '',
    amount: 0,
    balance: 0
  };
};

export const useBankStatementData = () => {
  return useQuery({
    queryKey: ["latest-bank-statement"],
    queryFn: async () => {
      console.log('Fetching latest bank statement data');
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
        .order('financial_documents.upload_date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching bank statement data:', error);
        throw error;
      }

      return data;
    }
  });
};