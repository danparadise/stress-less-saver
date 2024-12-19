import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const usePaystubData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: paystubs, isLoading, refetch } = useQuery({
    queryKey: ["paystub-data"],
    queryFn: async () => {
      console.log('Fetching paystub data');
      const { data, error } = await supabase
        .from("paystub_data")
        .select(`
          *,
          financial_documents!inner(
            file_name,
            upload_date,
            status,
            id,
            document_type
          )
        `)
        .eq('financial_documents.document_type', 'paystub')
        .order("pay_period_start", { ascending: true });

      if (error) throw error;
      
      const filteredData = data?.filter(item => 
        item.financial_documents?.document_type === 'paystub'
      );
      
      console.log('Fetched and filtered paystub data:', filteredData);
      return filteredData;
    },
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ paystubId, documentId }: { paystubId: string, documentId: string }) => {
      // First delete the paystub data
      const { error: paystubError } = await supabase
        .from("paystub_data")
        .delete()
        .eq("id", paystubId);
      
      if (paystubError) throw paystubError;

      // Then delete the financial document
      const { error: documentError } = await supabase
        .from("financial_documents")
        .delete()
        .eq("id", documentId);
      
      if (documentError) throw documentError;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Paystub data deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["paystub-data"] });
    },
    onError: (error) => {
      console.error("Error deleting paystub:", error);
      toast({
        title: "Error",
        description: "Failed to delete paystub data",
        variant: "destructive",
      });
    },
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      toast({
        title: "Success",
        description: "Data refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    }
  };

  return {
    paystubs,
    isLoading,
    handleRefresh,
    deleteMutation
  };
};