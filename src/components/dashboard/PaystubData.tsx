import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PaystubTable from "../paystubs/PaystubTable";
import PaystubEmpty from "../paystubs/PaystubEmpty";
import PaystubLoading from "../paystubs/PaystubLoading";
import { useEffect } from "react";

const PaystubData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to changes on both paystub_data and financial_documents tables
    const channel = supabase
      .channel('public:paystub_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'paystub_data'
        },
        () => {
          console.log('Paystub data changed, invalidating query');
          queryClient.invalidateQueries({ queryKey: ["paystub-data"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_documents'
        },
        () => {
          console.log('Financial document changed, invalidating query');
          queryClient.invalidateQueries({ queryKey: ["paystub-data"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: paystubs, isLoading } = useQuery({
    queryKey: ["paystub-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("paystub_data")
        .select(`
          *,
          financial_documents(
            file_name,
            upload_date,
            status,
            id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ paystubId, documentId }: { paystubId: string, documentId: string }) => {
      // Delete the financial document (this will cascade delete the paystub data)
      const { error } = await supabase
        .from("financial_documents")
        .delete()
        .eq("id", documentId);
      
      if (error) throw error;
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paystub Data</CardTitle>
        </CardHeader>
        <CardContent>
          <PaystubLoading />
        </CardContent>
      </Card>
    );
  }

  if (!paystubs?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paystub Data</CardTitle>
        </CardHeader>
        <CardContent>
          <PaystubEmpty />
        </CardContent>
      </Card>
    );
  }

  // Remove duplicates based on pay period dates and file name
  const uniquePaystubs = paystubs.reduce((acc, current) => {
    const key = `${current.pay_period_start}-${current.pay_period_end}-${current.financial_documents.file_name}`;
    const exists = acc.find(item => 
      `${item.pay_period_start}-${item.pay_period_end}-${item.financial_documents.file_name}` === key
    );
    
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, [] as typeof paystubs);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Paystub Data</CardTitle>
      </CardHeader>
      <CardContent>
        <PaystubTable 
          paystubs={uniquePaystubs} 
          onDelete={(paystubId, documentId) => deleteMutation.mutate({ paystubId, documentId })}
          isDeleting={deleteMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};

export default PaystubData;