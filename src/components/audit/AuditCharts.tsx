import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from "@/types/bankStatement";
import { convertJsonToTransaction } from "@/utils/transactionUtils";

interface AuditChartsProps {
  selectedMonth: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
    return <div className="text-muted-foreground">No data available for the selected month</div>;
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
          <h3 className="text-lg font-medium mb-4">Spending by Category</h3>
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
              >
                {chartData.categoryData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="h-[400px]">
          <h3 className="text-lg font-medium mb-4">Balance Trend</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.balanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={formatCurrency} />
              <Legend />
              <Bar dataKey="balance" fill="#8884d8" name="Balance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AuditCharts;