import { ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BarChart2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transaction } from "@/types/bankStatement";
import { useNavigate } from "react-router-dom";

interface MonthlyExpensesProps {
  transactions: Transaction[];
  monthlyExpenses: number;
}

const MonthlyExpenses = ({ transactions, monthlyExpenses }: MonthlyExpensesProps) => {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleAnalyticsClick = () => {
    navigate('/analytics');
  };

  return (
    <div className="bg-card rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-medium">Monthly Expenses</h3>
          <p className="text-2xl font-bold text-destructive">
            -{formatCurrency(monthlyExpenses)}
          </p>
        </div>
        <div className="bg-destructive/10 p-2 rounded-full">
          <ArrowDownRight className="h-5 w-5 text-destructive" />
        </div>
      </div>

      <ScrollArea className="h-[300px] w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions && transactions.length > 0 ? (
              transactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {format(new Date(transaction.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell className={`text-right ${
                    transaction.amount < 0 ? 'text-destructive' : 'text-sage-500'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(transaction.balance)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="mt-4">
        <Button
          variant="outline"
          onClick={handleAnalyticsClick}
          className="w-full flex items-center justify-center gap-2"
        >
          <BarChart2 className="h-4 w-4" />
          View Analytics
        </Button>
      </div>
    </div>
  );
};

export default MonthlyExpenses;