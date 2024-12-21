import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { format } from "date-fns";

interface SpendingDistributionChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  totalSpending: number;
  currentMonth: string | null;
  onCategoryClick: (category: string) => void;
}

const SpendingDistributionChart = ({ 
  data, 
  totalSpending, 
  currentMonth, 
  onCategoryClick 
}: SpendingDistributionChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="dark:bg-purple-800/10 backdrop-blur-lg border-purple-300/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-semibold text-purple-800 dark:text-purple-100">
            Spending by Category
          </span>
          {currentMonth && (
            <span className="text-sm font-normal text-muted-foreground">
              {format(new Date(currentMonth), "MMMM yyyy")}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={2}
                dataKey="value"
                onClick={(data) => onCategoryClick(data.name)}
                cursor="pointer"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-sm text-muted-foreground">Total Spending</p>
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-100">
              {formatCurrency(totalSpending)}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/10 p-2 rounded-md transition-colors"
              onClick={() => onCategoryClick(item.name)}
            >
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="ml-auto font-medium text-purple-800 dark:text-purple-100">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SpendingDistributionChart;