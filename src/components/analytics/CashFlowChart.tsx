import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
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
    // Only process transactions within the selected month
    if (currentMonth) {
      try {
        const transactionDate = new Date(transaction.date);
        const monthStart = startOfMonth(new Date(currentMonth));
        const monthEnd = endOfMonth(new Date(currentMonth));

        // Add debug logs
        console.log('Transaction date:', transactionDate);
        console.log('Month start:', monthStart);
        console.log('Month end:', monthEnd);
        console.log('Is within interval:', isWithinInterval(transactionDate, { start: monthStart, end: monthEnd }));

        if (!isWithinInterval(transactionDate, { start: monthStart, end: monthEnd })) {
          return acc;
        }
      } catch (error) {
        console.error('Error processing date:', error);
        console.error('Transaction:', transaction);
        return acc;
      }
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

  // Add debug log for processed data
  console.log('Processed data:', processedData);

  return (
    <Card className="dark:bg-purple-800/10 backdrop-blur-lg border-purple-300/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Cash Flow
          </span>
          {currentMonth && (
            <span className="text-sm font-normal text-purple-300">
              for {format(new Date(currentMonth), "MMMM yyyy")}
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
                className="text-xs"
              />
              <YAxis 
                stroke="#A78BFA"
                tickFormatter={formatCurrency}
                className="text-xs"
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Net Flow"]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                }}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.amount >= 0 ? "#34D399" : "#F87171"}
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