import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Text } from "recharts";
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

  // Enhanced color palette for better visual distinction
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Transfer': '#8B5CF6', // Vivid Purple
      'Financial': '#0EA5E9', // Ocean Blue
      'Shopping': '#D946EF', // Magenta Pink
      'Entertainment': '#F97316', // Bright Orange
      'Food & Dining': '#34D399', // Emerald
      'Groceries': '#A7F3D0', // Mint
      'Fast Food': '#FCD34D', // Amber
      'Restaurants': '#FB923C', // Orange
      'Credit Card Payment': '#818CF8', // Indigo
      'Electronics & Software': '#6366F1', // Blue
      'Gas': '#F472B6', // Pink
      'Personal Care': '#E879F9', // Fuchsia
      'Clothing': '#C084FC', // Purple
      'Television': '#2DD4BF', // Teal
      'Hair': '#F9A8D4', // Rose
      'Sporting Goods': '#4ADE80', // Green
      'Coffee Shops': '#BEF264', // Lime
      'Sports': '#38BDF8', // Sky
      'Service & Parts': '#94A3B8', // Gray
      'Gym': '#67E8F9', // Cyan
      'Business Services': '#A5B4FC', // Violet
      'Uncategorized': '#94A3B8', // Gray
    };
    return colors[category] || '#94A3B8';
  };

  return (
    <Card className="dark:bg-purple-800/10 backdrop-blur-lg border-purple-300/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Spending Distribution
          </span>
          {currentMonth && (
            <span className="text-sm font-normal text-purple-300">
              for {format(new Date(currentMonth), "MMMM yyyy")}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[600px] w-full">
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
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  value,
                  index
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = 25 + innerRadius + (outerRadius - innerRadius);
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  const percent = ((value / totalSpending) * 100).toFixed(0);

                  return percent !== "0" ? (
                    <text
                      x={x}
                      y={y}
                      fill="currentColor"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      className="text-xs font-medium fill-purple-200"
                    >
                      {`${percent}%`}
                    </text>
                  ) : null;
                }}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getCategoryColor(entry.name)}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Pie>
              {/* Add center text for total spending */}
              <Text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-purple-200 text-2xl font-bold"
              >
                {formatCurrency(totalSpending)}
              </Text>
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${formatCurrency(value)}`,
                  name
                ]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                }}
                itemStyle={{
                  color: 'hsl(var(--foreground))',
                }}
                labelStyle={{
                  color: 'hsl(var(--foreground))',
                  fontWeight: 'bold',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpendingDistributionChart;