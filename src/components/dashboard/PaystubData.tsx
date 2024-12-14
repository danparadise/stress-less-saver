import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
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
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No paystub data available. Try uploading a paystub document.
            </p>
          </div>
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Document</TableHead>
                <TableHead>Upload Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead>Pay Period</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uniquePaystubs.map((paystub) => (
                <TableRow key={paystub.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {paystub.financial_documents.file_name}
                  </TableCell>
                  <TableCell>
                    {paystub.financial_documents.upload_date
                      ? format(
                          new Date(paystub.financial_documents.upload_date),
                          "MMM d, yyyy"
                        )
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        paystub.financial_documents.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      }`}
                    >
                      {paystub.financial_documents.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {paystub.gross_pay
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(paystub.gross_pay)
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    {paystub.net_pay
                      ? new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(paystub.net_pay)
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {paystub.pay_period_start && paystub.pay_period_end
                      ? `${format(
                          new Date(paystub.pay_period_start),
                          "MMM d"
                        )} - ${format(new Date(paystub.pay_period_end), "MMM d, yyyy")}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(paystub.id)}
                      className="hover:bg-destructive/10 hover:text-destructive"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaystubData;