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
      <DialogContent className="max-w-4xl h-[80vh] p-0 bg-[#1E1533] border-none text-white overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold text-white">
            Transactions for {getMonthYear()}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 p-6 pt-2">
          <ScrollArea className="h-[calc(80vh-120px)] w-full rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10">
                  <TableHead className="text-lg font-medium text-white sticky top-0 bg-[#1E1533] z-10">Date</TableHead>
                  <TableHead className="text-lg font-medium text-white sticky top-0 bg-[#1E1533] z-10">Description</TableHead>
                  <TableHead className="text-lg font-medium text-white sticky top-0 bg-[#1E1533] z-10">Category</TableHead>
                  <TableHead className="text-lg font-medium text-white text-right sticky top-0 bg-[#1E1533] z-10">Amount</TableHead>
                  <TableHead className="text-lg font-medium text-white text-right sticky top-0 bg-[#1E1533] z-10">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow 
                    key={index} 
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <TableCell className="text-white font-medium">
                      {format(new Date(transaction.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {transaction.description}
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {transaction.category}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      transaction.amount < 0 
                        ? 'text-red-400 hover:text-red-300' 
                        : 'text-green-400 hover:text-green-300'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-right text-white font-medium">
                      {formatCurrency(transaction.balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionsPopup;