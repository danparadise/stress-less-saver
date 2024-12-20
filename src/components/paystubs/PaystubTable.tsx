import { format } from "date-fns";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

interface PaystubTableProps {
  paystubs: any[];
  onDelete: (paystubId: string, documentId: string) => void;
  isDeleting: boolean;
}

const PaystubTable = ({ paystubs, onDelete, isDeleting }: PaystubTableProps) => {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortedData, setSortedData] = useState(paystubs);

  const handleSortByDate = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    
    const sorted = [...sortedData].sort((a, b) => {
      if (!a.pay_period_start || !b.pay_period_start) return 0;
      
      const dateA = new Date(a.pay_period_start).getTime();
      const dateB = new Date(b.pay_period_start).getTime();
      
      return newOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    setSortedData(sorted);
    setSortOrder(newOrder);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Document</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead 
              onClick={handleSortByDate}
              className="cursor-pointer hover:bg-muted/70 transition-colors flex items-center gap-2"
            >
              Pay Period
              {sortOrder === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </TableHead>
            <TableHead className="text-right">Gross Pay</TableHead>
            <TableHead className="text-right">Net Pay</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((paystub) => (
            <TableRow key={paystub.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                {paystub.financial_documents?.file_name || 'N/A'}
              </TableCell>
              <TableCell>
                {paystub.financial_documents?.upload_date
                  ? format(
                      new Date(paystub.financial_documents.upload_date),
                      "MMM d, yyyy"
                    )
                  : "N/A"}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    paystub.financial_documents?.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {paystub.financial_documents?.status || 'pending'}
                </span>
              </TableCell>
              <TableCell>
                {paystub.pay_period_start && paystub.pay_period_end
                  ? `${format(
                      new Date(paystub.pay_period_start),
                      "MMM d"
                    )} - ${format(new Date(paystub.pay_period_end), "MMM d, yyyy")}`
                  : "N/A"}
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(paystub.id, paystub.financial_documents?.id)}
                  className="hover:bg-destructive/10 hover:text-destructive"
                  disabled={isDeleting || !paystub.financial_documents?.id}
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