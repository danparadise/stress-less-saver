import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PaystubTableProps {
  paystubs: any[];
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const PaystubTable = ({ paystubs, onDelete, isDeleting }: PaystubTableProps) => {
  return (
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
          {paystubs.map((paystub) => (
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
                  onClick={() => onDelete(paystub.id)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PaystubTable;