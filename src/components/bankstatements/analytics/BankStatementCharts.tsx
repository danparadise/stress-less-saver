import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { BankStatement } from '@/types/bankStatement';

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
    </div>
  );
};

export default BankStatementCharts;