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
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  balance: number;
}

interface TransactionsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  transactions: Transaction[];
  color: string;
}

const TransactionsPopup = ({
  isOpen,
  onClose,
  transactions,
}: TransactionsPopupProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getMonthYear = () => {
    if (transactions && transactions.length > 0) {
      return format(new Date(transactions[0].date), "MMMM yyyy");
    }
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-[#1E1533] border-none text-white">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 rounded-full hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-4 w-4 text-white" />
          </Button>
          <DialogTitle className="text-2xl font-bold text-white">
            Transactions for {getMonthYear()}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] w-full rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/10">
                <TableHead className="text-lg font-medium text-white">Date</TableHead>
                <TableHead className="text-lg font-medium text-white">Description</TableHead>
                <TableHead className="text-lg font-medium text-white">Category</TableHead>
                <TableHead className="text-lg font-medium text-white text-right">Amount</TableHead>
                <TableHead className="text-lg font-medium text-white text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow 
                  key={index} 
                  className="border-b border-white/10 hover:bg-white/5"
                >
                  <TableCell className="text-white">
                    {format(new Date(transaction.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-white">
                    {transaction.description}
                  </TableCell>
                  <TableCell className="text-white">
                    {transaction.category}
                  </TableCell>
                  <TableCell className={`text-right ${
                    transaction.amount < 0 
                      ? 'text-red-400' 
                      : 'text-green-400'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-right text-white">
                    {formatCurrency(transaction.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionsPopup;