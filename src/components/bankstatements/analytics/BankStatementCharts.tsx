import { format } from 'date-fns';
import { BankStatement } from '@/types/bankStatement';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="space-y-8">
      {/* Transaction Details Table */}
      <Card className="mx-auto max-w-5xl">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.transactions?.map((transaction, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell>
                      {format(new Date(transaction.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell>{transaction.category || 'Uncategorized'}</TableCell>
                    <TableCell className={`text-right ${
                      transaction.amount < 0 
                        ? 'text-red-500 dark:text-red-400' 
                        : 'text-green-500 dark:text-green-400'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankStatementCharts;