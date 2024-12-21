import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, isValid, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface IncomeChartProps {
  data: Array<{ date: string; amount: number }>;
}

const IncomeChart = ({ data }: IncomeChartProps) => {
  const navigate = useNavigate();
  
  const formatDate = (dateStr: string) => {
    try {
      const parsedDate = parseISO(dateStr);
      if (!isValid(parsedDate)) {
        console.error('Invalid date:', dateStr);
        return 'Invalid Date';
      }
      return format(parsedDate, "MMM d");
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
      maximumFractionDigits: 2,
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

  // Sort data by date to ensure correct chronological order
  const sortedData = [...validData].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA - dateB;
  });

  if (sortedData.length === 0) {
    return (
      <Card className="col-span-2 p-6 glass-card">
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <h3 className="text-xl font-semibold text-purple-800">
            No Income Data Available
          </h3>
          <p className="text-center text-purple-600 max-w-md">
            Upload your paystubs to see your income trends and get personalized financial insights.
          </p>
          <Button 
            onClick={() => navigate("/paystubs")}
            className="mt-4 bg-purple-600 hover:bg-purple-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Paystub
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="col-span-2 p-6 glass-card">
      <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-4">Net Income Trend</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sortedData}>
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
              formatter={(value: number) => [formatCurrency(value), "Net Pay"]}
              labelFormatter={(label) => {
                const date = parseISO(label as string);
                return isValid(date) ? format(date, "MMM d, yyyy") : label;
              }}
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