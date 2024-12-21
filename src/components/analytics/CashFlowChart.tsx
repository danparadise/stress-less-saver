import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CashFlowChartProps {
  data: Array<{
    date: string;
    amount: number;
    type: 'income' | 'expense';
    description: string;
  }>;
  currentMonth: string | null;
}

const CashFlowChart = ({ data, currentMonth }: CashFlowChartProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Process data to show daily net cash flow
  const processedData = data.reduce((acc: any[], transaction) => {
    if (!transaction.date) {
      console.warn('Transaction missing date:', transaction);
      return acc;
    }

    const date = format(new Date(transaction.date), 'MMM dd');
    const existingDay = acc.find(item => item.date === date);

    if (existingDay) {
      existingDay.amount += transaction.amount;
    } else {
      acc.push({
        date,
        amount: transaction.amount,
      });
    }

    return acc;
  }, []);

  // Sort data by date
  processedData.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  // Custom tooltip component for better visibility
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const amount = payload[0].value;
      return (
        <div className="bg-[#1A1F2C] border border-purple-400/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-medium mb-1">{label}</p>
          <p className="text-emerald-400 font-mono font-bold">
            Net Flow: {formatCurrency(amount)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="dark:bg-purple-800/10 backdrop-blur-lg border-purple-300/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl font-semibold text-purple-800 dark:text-purple-100">
            Cash Flow
          </span>
          {currentMonth && (
            <span className="text-sm font-normal text-muted-foreground">
              {format(new Date(currentMonth), "MMMM yyyy")}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                stroke="#A78BFA"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#A78BFA"
                tickFormatter={formatCurrency}
                fontSize={12}
                tickLine={false}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(167, 139, 250, 0.1)' }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.amount >= 0 ? "#34D399" : "#F87171"}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CashFlowChart;