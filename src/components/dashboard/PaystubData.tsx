import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import PaystubTable from "../paystubs/PaystubTable";
import PaystubEmpty from "../paystubs/PaystubEmpty";
import PaystubLoading from "../paystubs/PaystubLoading";
import { useEffect } from "react";

const PaystubData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up real-time subscriptions');
    
    // Create a channel for real-time updates
    const channel = supabase
      .channel('paystub-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'paystub_data'
        },
        (payload) => {
          console.log('Paystub data changed:', payload);
          // Immediately invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ["paystub-data"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'financial_documents'
        },
        (payload) => {
          console.log('Financial document changed:', payload);
          // Immediately invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ["paystub-data"] });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: paystubs, isLoading, refetch } = useQuery({
    queryKey: ["paystub-data"],
    queryFn: async () => {
      console.log('Fetching paystub data');
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
      console.log('Fetched paystub data:', data);
      return data;
    },
    // Enable real-time updates
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0
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
      // Force an immediate refetch after deletion
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Extracted Paystub Data</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
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