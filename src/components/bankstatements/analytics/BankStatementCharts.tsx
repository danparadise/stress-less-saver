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
    <div className="container mx-auto px-4">
      <Card className="mx-auto max-w-5xl">
        <CardContent className="p-6">
          <h3 className="text-2xl font-semibold mb-6 text-center">Transaction Details</h3>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[150px] text-left">Date</TableHead>
                  <TableHead className="w-[300px] text-left">Description</TableHead>
                  <TableHead className="w-[200px] text-left">Category</TableHead>
                  <TableHead className="text-right w-[150px]">Amount</TableHead>
                  <TableHead className="text-right w-[150px]">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.transactions && statement.transactions.length > 0 ? (
                  statement.transactions.map((transaction, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell>
                        {format(new Date(transaction.date), 'MM/dd/yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell className={`text-right ${
                        transaction.amount < 0 
                          ? 'text-destructive' 
                          : 'text-green-600 dark:text-green-400'
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
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No transaction data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankStatementCharts;