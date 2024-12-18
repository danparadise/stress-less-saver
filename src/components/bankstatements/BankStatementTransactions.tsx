import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  balance: number;
}

interface BankStatementTransactionsProps {
  transactions: Transaction[] | null;
  statementMonth: string;
}

const BankStatementTransactions = ({ transactions, statementMonth }: BankStatementTransactionsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!transactions || transactions.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        View Transactions
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Transactions for {format(new Date(statementMonth), "MMMM yyyy")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
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
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BankStatementTransactions;