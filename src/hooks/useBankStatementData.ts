import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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