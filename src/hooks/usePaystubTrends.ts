import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePaystubTrends = () => {
  return useQuery({
    queryKey: ["paystub-data"],
    queryFn: async () => {
      console.log('Fetching paystub data for income trend');
      const { data, error } = await supabase
        .from("paystub_data")
        .select(`
          gross_pay,
          pay_period_start,
          financial_documents!inner(
            status,
            document_type
          )
        `)
        .eq('financial_documents.status', 'completed')
        .eq('financial_documents.document_type', 'paystub')
        .order('pay_period_start', { ascending: true });

      if (error) {
        console.error('Error fetching paystub data:', error);
        throw error;
      }
      
      const chartData = data?.map(item => ({
        date: item.pay_period_start,
        amount: Number(item.gross_pay)
      })).filter(item => 
        !isNaN(item.amount) && 
        item.date
      ) || [];
      
      console.log('Transformed paystub data for chart:', chartData);
      return chartData;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });
};