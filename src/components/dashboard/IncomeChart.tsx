import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, isValid, parseISO } from "date-fns";

interface IncomeChartProps {
  data: Array<{ date: string; amount: number }>;
}

const IncomeChart = ({ data }: IncomeChartProps) => {
  const formatDate = (dateStr: string) => {
    try {
      const parsedDate = parseISO(dateStr);
      if (!isValid(parsedDate)) {
        console.error('Invalid date:', dateStr);
        return 'Invalid Date';
      }
      return format(parsedDate, "MMM yyyy");
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Validate and clean data before rendering
  const validData = data.filter(item => {
    try {
      const parsedDate = parseISO(item.date);
      return isValid(parsedDate) && !isNaN(item.amount);
    } catch {
      return false;
    }
  });

  return (
    <Card className="col-span-2 p-6 glass-card">
      <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-4">Income Trend</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={validData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              stroke="#1E1533"
              tickFormatter={formatDate}
            />
            <YAxis 
              stroke="#1E1533"
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), "Gross Pay"]}
              labelFormatter={formatDate}
            />
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#8CA891"
              strokeWidth={2}
              dot={{ fill: "#8CA891" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default IncomeChart;