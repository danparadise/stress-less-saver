import { format } from 'date-fns';
import { BankStatement } from '@/types/bankStatement';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="w-full h-full p-4">
      <Card className="bg-[#1E1533] border-none shadow-lg h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-3xl font-bold text-white">
            Transaction Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-[#2D1B4B] p-4 h-[calc(100vh-12rem)]">
            <h3 className="text-2xl font-semibold mb-4 text-white">
              Transaction Details
            </h3>
            <div className="relative h-[calc(100%-4rem)] w-full">
              <ScrollArea className="h-full w-full rounded-md">
                <div className="min-w-full">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-white/10">
                        <TableHead className="text-lg font-medium text-white sticky top-0 bg-[#2D1B4B]">Date</TableHead>
                        <TableHead className="text-lg font-medium text-white sticky top-0 bg-[#2D1B4B]">Description</TableHead>
                        <TableHead className="text-lg font-medium text-white sticky top-0 bg-[#2D1B4B]">Category</TableHead>
                        <TableHead className="text-lg font-medium text-white text-right sticky top-0 bg-[#2D1B4B]">Amount</TableHead>
                        <TableHead className="text-lg font-medium text-white text-right sticky top-0 bg-[#2D1B4B]">Balance</TableHead>
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
                </div>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankStatementCharts;