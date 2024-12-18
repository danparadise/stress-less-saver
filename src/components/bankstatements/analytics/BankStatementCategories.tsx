import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Transaction } from '@/types/bankStatement';
import { Card, CardContent } from "@/components/ui/card";

interface BankStatementCategoriesProps {
  transactions: Transaction[];
}

const BankStatementCategories = ({ transactions }: BankStatementCategoriesProps) => {
  // Group transactions by category and calculate totals (only expenses)
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
    <Card>
      <CardContent className="p-6">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 40,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis 
                dataKey="category" 
                angle={-45}
                textAnchor="end"
                height={60}
                stroke="#888888"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                stroke="#888888"
                fontSize={12}
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
              <Bar 
                dataKey="amount" 
                fill="hsl(var(--primary))" 
                name="Spending Amount"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default BankStatementCategories;