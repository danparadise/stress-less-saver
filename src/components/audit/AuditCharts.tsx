import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from "@/types/bankStatement";
import { convertJsonToTransaction } from "@/utils/transactionUtils";

interface AuditChartsProps {
  selectedMonth: string | null;
}

const COLORS = ['#8B5CF6', '#34D399', '#F472B6', '#0EA5E9', '#D946EF', '#F97316', '#A78BFA'];

const AuditCharts = ({ selectedMonth }: AuditChartsProps) => {
  const { data: chartData } = useQuery({
    queryKey: ["audit-charts", selectedMonth],
    queryFn: async () => {
      if (!selectedMonth) return null;

      const { data, error } = await supabase
        .from("monthly_financial_summaries")
        .select("*")
        .eq("month_year", selectedMonth)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Prepare category data for pie chart
      const categoryData = Object.entries(data.transaction_categories as Record<string, number>)
        .map(([name, value]) => ({
          name,
          value: Number(value)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Prepare daily balance data
      const rawTransactions = Array.isArray(data.transactions) ? data.transactions : [];
      const transactions = rawTransactions.map(convertJsonToTransaction);
      
      const balanceData = transactions
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(t => ({
          date: new Date(t.date).toLocaleDateString(),
          balance: t.balance
        }));

      return {
        categoryData,
        balanceData
      };
    },
    enabled: !!selectedMonth
  });

  if (!chartData) {
    return (
      <div className="text-muted-foreground text-center py-4">
        No data available for the selected month
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="h-[400px]">
          <h3 className="text-lg font-medium mb-4 text-purple-800 dark:text-purple-100">
            Spending by Category
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                className="transition-opacity hover:opacity-80"
              >
                {chartData.categoryData.map((entry: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[400px]">
          <h3 className="text-lg font-medium mb-4 text-purple-800 dark:text-purple-100">
            Balance Trend
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.balanceData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                stroke="#A78BFA"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                stroke="#A78BFA"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem'
                }}
                cursor={{ fill: 'rgba(167, 139, 250, 0.1)' }}
              />
              <Bar 
                dataKey="balance" 
                fill="#8884d8" 
                name="Balance"
                radius={[4, 4, 0, 0]}
                className="transition-opacity hover:opacity-80"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AuditCharts;