import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Transaction } from '@/types/bankStatement';

interface BankStatementCategoriesProps {
  transactions: Transaction[];
}

const BankStatementCategories = ({ transactions }: BankStatementCategoriesProps) => {
  // Group transactions by category and calculate totals
  const categoryTotals = transactions.reduce((acc: Record<string, number>, transaction: Transaction) => {
    const category = transaction.category || 'Uncategorized';
    // Only include expenses (negative amounts)
    if (transaction.amount < 0) {
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
    }
    return acc;
  }, {});

  const data = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount); // Sort by amount in descending order

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            labelStyle={{ color: 'black' }}
          />
          <Legend />
          <Bar dataKey="amount" fill="#8884d8" name="Spending Amount" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BankStatementCategories;