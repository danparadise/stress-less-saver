import { format } from "date-fns";
import { Trash2, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import BankStatementTransactions from "./BankStatementTransactions";
import { useNavigate } from "react-router-dom";

interface BankStatementTableRowProps {
  statement: any;
  onDelete: (statementId: string, documentId: string) => void;
  isDeleting: boolean;
}

const BankStatementTableRow = ({ statement, onDelete, isDeleting }: BankStatementTableRowProps) => {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">
        <HoverCard>
          <HoverCardTrigger>
            {statement.financial_documents.file_name}
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="flex justify-between space-x-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">View Analytics</h4>
                <p className="text-sm">
                  Click to see detailed financial analysis and insights
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate(`/bank-statements/${statement.id}/analytics`)}
                >
                  <BarChart2 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
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
      <TableCell className="space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(`/bank-statements/${statement.id}/analytics`)}
          className="hover:bg-primary/10 hover:text-primary"
        >
          <BarChart2 className="h-4 w-4" />
        </Button>
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
  );
};

export default BankStatementTableRow;