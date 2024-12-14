import { useQuery } from "@tanstack/react-query";
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

const PaystubData = () => {
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
  });

  if (isLoading) {
    return <div>Loading paystub data...</div>;
  }

  if (!paystubs?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paystub Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No paystub data available. Try uploading a paystub document.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Paystub Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gross Pay</TableHead>
              <TableHead>Net Pay</TableHead>
              <TableHead>Pay Period</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paystubs.map((paystub) => (
              <TableRow key={paystub.id}>
                <TableCell>{paystub.financial_documents.file_name}</TableCell>
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
                    className={`px-2 py-1 rounded-full text-xs ${
                      paystub.financial_documents.status === "completed"
                        ? "bg-sage-100 text-sage-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {paystub.financial_documents.status}
                  </span>
                </TableCell>
                <TableCell>${paystub.gross_pay || "N/A"}</TableCell>
                <TableCell>${paystub.net_pay || "N/A"}</TableCell>
                <TableCell>
                  {paystub.pay_period_start && paystub.pay_period_end
                    ? `${format(
                        new Date(paystub.pay_period_start),
                        "MMM d"
                      )} - ${format(new Date(paystub.pay_period_end), "MMM d, yyyy")}`
                    : "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PaystubData;