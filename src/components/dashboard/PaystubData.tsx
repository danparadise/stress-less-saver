import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import PaystubTable from "../paystubs/PaystubTable";
import PaystubEmpty from "../paystubs/PaystubEmpty";
import PaystubLoading from "../paystubs/PaystubLoading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const PaystubData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [payPeriodFilter, setPayPeriodFilter] = useState<string>("all");
  const [grossPayFilter, setGrossPayFilter] = useState<string>("all");

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

  // Apply filters
  const filteredPaystubs = uniquePaystubs.filter(paystub => {
    let passesPayPeriodFilter = true;
    let passesGrossPayFilter = true;

    // Pay Period Filter
    if (payPeriodFilter !== "all") {
      const today = new Date();
      const startDate = new Date(paystub.pay_period_start);
      
      switch (payPeriodFilter) {
        case "last30":
          const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
          passesPayPeriodFilter = startDate >= thirtyDaysAgo;
          break;
        case "last90":
          const ninetyDaysAgo = new Date(today.setDate(today.getDate() - 90));
          passesPayPeriodFilter = startDate >= ninetyDaysAgo;
          break;
        case "thisYear":
          passesPayPeriodFilter = startDate.getFullYear() === new Date().getFullYear();
          break;
      }
    }

    // Gross Pay Filter
    if (grossPayFilter !== "all" && paystub.gross_pay) {
      const grossPay = Number(paystub.gross_pay);
      switch (grossPayFilter) {
        case "lessThan1000":
          passesGrossPayFilter = grossPay < 1000;
          break;
        case "1000to3000":
          passesGrossPayFilter = grossPay >= 1000 && grossPay <= 3000;
          break;
        case "moreThan3000":
          passesGrossPayFilter = grossPay > 3000;
          break;
      }
    }

    return passesPayPeriodFilter && passesGrossPayFilter;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Paystub Data</CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="w-48">
            <Select value={payPeriodFilter} onValueChange={setPayPeriodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Pay Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="last90">Last 90 Days</SelectItem>
                <SelectItem value="thisYear">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select value={grossPayFilter} onValueChange={setGrossPayFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Gross Pay" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Amounts</SelectItem>
                <SelectItem value="lessThan1000">Less than $1,000</SelectItem>
                <SelectItem value="1000to3000">$1,000 - $3,000</SelectItem>
                <SelectItem value="moreThan3000">More than $3,000</SelectItem>
              </SelectContent>
            </Select>
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