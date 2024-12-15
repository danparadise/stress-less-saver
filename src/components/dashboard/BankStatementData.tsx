import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import BankStatementTable from "../bankstatements/BankStatementTable";
import BankStatementEmpty from "../bankstatements/BankStatementEmpty";
import BankStatementLoading from "../bankstatements/BankStatementLoading";

const BankStatementData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('Setting up real-time subscriptions');
    
    const channel = supabase
      .channel('bank-statement-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_statement_data'
        },
        (payload) => {
          console.log('Bank statement data changed:', payload);
          queryClient.invalidateQueries({ queryKey: ["bank-statement-data"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_documents'
        },
        (payload) => {
          console.log('Financial document changed:', payload);
          queryClient.invalidateQueries({ queryKey: ["bank-statement-data"] });
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

  const { data: statements, isLoading, refetch } = useQuery({
    queryKey: ["bank-statement-data"],
    queryFn: async () => {
      console.log('Fetching bank statement data');
      const { data, error } = await supabase
        .from("bank_statement_data")
        .select(`
          *,
          financial_documents(
            file_name,
            upload_date,
            status,
            id
          )
        `)
        .order("statement_month", { ascending: false });

      if (error) throw error;
      console.log('Fetched bank statement data:', data);
      return data;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ statementId, documentId }: { statementId: string, documentId: string }) => {
      const { error } = await supabase
        .from("financial_documents")
        .delete()
        .eq("id", documentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bank statement deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["bank-statement-data"] });
    },
    onError: (error) => {
      console.error("Error deleting bank statement:", error);
      toast({
        title: "Error",
        description: "Failed to delete bank statement",
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

  const cardHeader = (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Bank Statement Data</CardTitle>
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
  );

  if (isLoading) {
    return (
      <Card>
        {cardHeader}
        <CardContent>
          <BankStatementLoading />
        </CardContent>
      </Card>
    );
  }

  if (!statements?.length) {
    return (
      <Card>
        {cardHeader}
        <CardContent>
          <BankStatementEmpty />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {cardHeader}
      <CardContent>
        <BankStatementTable 
          statements={statements} 
          onDelete={(statementId, documentId) => deleteMutation.mutate({ statementId, documentId })}
          isDeleting={deleteMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};

export default BankStatementData;