import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { BankStatement } from '@/types/bankStatement';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BankStatementChartsProps {
  statement: BankStatement;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const BankStatementCharts = ({ statement }: BankStatementChartsProps) => {
  // Prepare data for the pie chart
  const pieData = [
    { name: 'Deposits', value: statement.total_deposits || 0 },
    { name: 'Withdrawals', value: Math.abs(statement.total_withdrawals || 0) },
  ];

  // Prepare data for the line chart
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
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={lineData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="balance" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Transaction Details</h3>
        <div className="rounded-md border">
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
              {statement.transactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>{format(new Date(transaction.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell className={`text-right ${
                    transaction.amount < 0 ? 'text-destructive' : 'text-green-600'
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
      </div>
    </div>
  );
};

export default BankStatementCharts;