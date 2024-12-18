import { format } from 'date-fns';
import { BankStatement } from '@/types/bankStatement';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BankStatementChartsProps {
  statement: BankStatement;
}

const BankStatementCharts = ({ statement }: BankStatementChartsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="w-full bg-[#1E1533] rounded-lg shadow-lg p-6">
      <h2 className="text-3xl font-bold text-white mb-4">
        Transaction Overview
      </h2>
      <div className="bg-[#2D1B4B] rounded-lg p-4">
        <div className="relative w-full">
          <ScrollArea className="h-[500px] w-full rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white/10">
                  <TableHead className="text-lg font-medium text-white sticky top-0 bg-[#2D1B4B] z-10">Date</TableHead>
                  <TableHead className="text-lg font-medium text-white sticky top-0 bg-[#2D1B4B] z-10">Description</TableHead>
                  <TableHead className="text-lg font-medium text-white sticky top-0 bg-[#2D1B4B] z-10">Category</TableHead>
                  <TableHead className="text-lg font-medium text-white text-right sticky top-0 bg-[#2D1B4B] z-10">Amount</TableHead>
                  <TableHead className="text-lg font-medium text-white text-right sticky top-0 bg-[#2D1B4B] z-10">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.transactions && statement.transactions.length > 0 ? (
                  statement.transactions.map((transaction, index) => (
                    <TableRow 
                      key={index} 
                      className="border-b border-white/10 hover:bg-white/5"
                    >
                      <TableCell className="text-white">
                        {format(new Date(transaction.date), 'MM/dd/yyyy')}
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell 
                      colSpan={5} 
                      className="text-center py-6 text-white/60"
                    >
                      No transaction data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default BankStatementCharts;