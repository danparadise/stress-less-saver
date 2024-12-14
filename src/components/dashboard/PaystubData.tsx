import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import PaystubTable from "../paystubs/PaystubTable";
import PaystubEmpty from "../paystubs/PaystubEmpty";
import PaystubLoading from "../paystubs/PaystubLoading";

const PaystubData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
            status
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (paystubId: string) => {
      const { error } = await supabase
        .from("paystub_data")
        .delete()
        .eq("id", paystubId);
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

  // Filter out duplicates based on pay period
  const uniquePaystubs = paystubs.reduce((acc, current) => {
    const payPeriodKey = current.pay_period_start && current.pay_period_end
      ? `${current.pay_period_start}-${current.pay_period_end}`
      : null;
    
    if (!payPeriodKey) return [...acc, current];

    const exists = acc.find(item => 
      item.pay_period_start === current.pay_period_start && 
      item.pay_period_end === current.pay_period_end
    );

    if (!exists) {
      return [...acc, current];
    }

    return acc;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Paystub Data</CardTitle>
      </CardHeader>
      <CardContent>
        <PaystubTable 
          paystubs={uniquePaystubs} 
          onDelete={(id) => deleteMutation.mutate(id)}
          isDeleting={deleteMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};

export default PaystubData;