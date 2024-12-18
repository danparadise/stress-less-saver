import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { BankStatement } from '@/types/bankStatement';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface BankStatementChartsProps {
  statement: BankStatement;
}

const BankStatementCharts = ({ statement }: BankStatementChartsProps) => {
  // Prepare data for the line chart - ensure we have valid transactions
  const lineData = statement.transactions?.map((transaction) => ({
    date: format(new Date(transaction.date), 'MMM d'),
    balance: transaction.balance,
  })) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Balance Over Time Chart */}
      <div className="h-[300px] w-full bg-card rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={lineData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
            <XAxis 
              dataKey="date" 
              stroke="#888888"
              fontSize={12}
            />
            <YAxis 
              stroke="#888888"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                color: 'hsl(var(--foreground))'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="hsl(var(--primary))" 
              name="Balance"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction Details Table */}
      <Card>
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
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.transactions?.map((transaction, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell>{format(new Date(transaction.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell>{transaction.category || 'Uncategorized'}</TableCell>
                    <TableCell className={`text-right ${
                      transaction.amount < 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'
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
        </CardContent>
      </Card>
    </div>
  );
};

export default BankStatementCharts;