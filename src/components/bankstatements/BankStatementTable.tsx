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
import BankStatementTransactions from "./BankStatementTransactions";

interface BankStatementTableProps {
  statements: any[];
  onDelete: (statementId: string, documentId: string) => void;
  isDeleting: boolean;
}

const BankStatementTable = ({ statements, onDelete, isDeleting }: BankStatementTableProps) => {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortedData, setSortedData] = useState(statements);

  const handleSortByDate = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    
    const sorted = [...sortedData].sort((a, b) => {
      if (!a.statement_month || !b.statement_month) return 0;
      
      const dateA = new Date(a.statement_month).getTime();
      const dateB = new Date(b.statement_month).getTime();
      
      return newOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    setSortedData(sorted);
    setSortOrder(newOrder);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
              Statement Month
              {sortOrder === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </TableHead>
            <TableHead className="text-right">Total Deposits</TableHead>
            <TableHead className="text-right">Total Withdrawals</TableHead>
            <TableHead className="text-right">Ending Balance</TableHead>
            <TableHead>Transactions</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((statement) => (
            <TableRow key={statement.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                {statement.financial_documents.file_name}
              </TableCell>
              <TableCell>
                {statement.financial_documents.upload_date
                  ? format(
                      new Date(statement.financial_documents.upload_date),
                      "MMM d, yyyy"
                    )
                  : "N/A"}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statement.financial_documents.status === "completed"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {statement.financial_documents.status}
                </span>
              </TableCell>
              <TableCell>
                {statement.statement_month
                  ? format(new Date(statement.statement_month), "MMMM yyyy")
                  : "N/A"}
              </TableCell>
              <TableCell className="text-right">
                {statement.total_deposits
                  ? formatCurrency(statement.total_deposits)
                  : "N/A"}
              </TableCell>
              <TableCell className="text-right">
                {statement.total_withdrawals
                  ? formatCurrency(statement.total_withdrawals)
                  : "N/A"}
              </TableCell>
              <TableCell className="text-right">
                {statement.ending_balance
                  ? formatCurrency(statement.ending_balance)
                  : "N/A"}
              </TableCell>
              <TableCell>
                {statement.transactions && (
                  <BankStatementTransactions 
                    transactions={statement.transactions}
                    statementMonth={statement.statement_month}
                  />
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(statement.id, statement.financial_documents.id)}
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

export default BankStatementTable;