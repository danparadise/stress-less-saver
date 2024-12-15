import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import PaystubTable from "../paystubs/PaystubTable";
import PaystubEmpty from "../paystubs/PaystubEmpty";
import PaystubLoading from "../paystubs/PaystubLoading";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

type SortDirection = "asc" | "desc";

const PaystubData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dateSort, setDateSort] = useState<SortDirection>("desc");
  const [paySort, setPaySort] = useState<SortDirection>("desc");

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

  // Sort paystubs by pay period dates
  const sortedPaystubs = [...(paystubs || [])].sort((a, b) => {
    if (!a.pay_period_start || !b.pay_period_start) return 0;
    
    const dateA = new Date(a.pay_period_start);
    const dateB = new Date(b.pay_period_start);
    
    if (dateSort === "desc") {
      return dateB.getTime() - dateA.getTime();
    }
    return dateA.getTime() - dateB.getTime();
  });

  // Remove duplicates based on pay period dates and file name
  const uniquePaystubs = sortedPaystubs.reduce((acc, current) => {
    const key = `${current.pay_period_start}-${current.pay_period_end}-${current.financial_documents.file_name}`;
    const exists = acc.find(item => 
      `${item.pay_period_start}-${item.pay_period_end}-${item.financial_documents.file_name}` === key
    );
    
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, [] as typeof sortedPaystubs);

  // Sort by gross pay if needed
  const finalSortedPaystubs = [...uniquePaystubs].sort((a, b) => {
    const aGrossPay = Number(a.gross_pay) || 0;
    const bGrossPay = Number(b.gross_pay) || 0;
    return paySort === "desc" ? bGrossPay - aGrossPay : aGrossPay - bGrossPay;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Paystub Data</CardTitle>
        <div className="flex gap-4 mt-4">
          <Button
            variant="outline"
            onClick={() => setDateSort(prev => prev === "desc" ? "asc" : "desc")}
            className="flex items-center gap-2"
          >
            Sort by Date
            <ArrowUpDown className="h-4 w-4" />
            {dateSort === "desc" ? "↓" : "↑"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setPaySort(prev => prev === "desc" ? "asc" : "desc")}
            className="flex items-center gap-2"
          >
            Sort by Gross Pay
            <ArrowUpDown className="h-4 w-4" />
            {paySort === "desc" ? "↓" : "↑"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <PaystubTable 
          paystubs={finalSortedPaystubs} 
          onDelete={(id) => deleteMutation.mutate(id)}
          isDeleting={deleteMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};

export default PaystubData;