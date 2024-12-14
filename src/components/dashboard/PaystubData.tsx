import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import PaystubTable from "../paystubs/PaystubTable";
import PaystubEmpty from "../paystubs/PaystubEmpty";
import PaystubLoading from "../paystubs/PaystubLoading";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const PaystubData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [minGrossPay, setMinGrossPay] = useState<string>("");
  const [maxGrossPay, setMaxGrossPay] = useState<string>("");

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
  const sortedPaystubs = [...paystubs].sort((a, b) => {
    if (!a.pay_period_start || !b.pay_period_start) return 0;
    return new Date(b.pay_period_start).getTime() - new Date(a.pay_period_start).getTime();
  });

  // Filter paystubs based on gross pay range
  const filteredPaystubs = sortedPaystubs.filter(paystub => {
    if (!paystub.gross_pay) return true;
    
    const grossPay = Number(paystub.gross_pay);
    const min = minGrossPay ? Number(minGrossPay) : -Infinity;
    const max = maxGrossPay ? Number(maxGrossPay) : Infinity;
    
    return grossPay >= min && grossPay <= max;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Paystub Data</CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="w-48">
            <Input
              type="number"
              placeholder="Min Gross Pay"
              value={minGrossPay}
              onChange={(e) => setMinGrossPay(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-48">
            <Input
              type="number"
              placeholder="Max Gross Pay"
              value={maxGrossPay}
              onChange={(e) => setMaxGrossPay(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <PaystubTable 
          paystubs={filteredPaystubs} 
          onDelete={(id) => deleteMutation.mutate(id)}
          isDeleting={deleteMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};

export default PaystubData;