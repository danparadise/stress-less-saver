import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface BankStatementCategoriesProps {
  transactions: any[];
}

const BankStatementCategories = ({ transactions }: BankStatementCategoriesProps) => {
  // Group transactions by category and calculate totals
  const categoryTotals = transactions?.reduce((acc: any, transaction: any) => {
    const category = transaction.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
    return acc;
  }, {});

  const data = Object.entries(categoryTotals || {}).map(([category, amount]) => ({
    category,
    amount,
  }));

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
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BankStatementCategories;