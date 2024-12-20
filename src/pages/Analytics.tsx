import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import TransactionsPopup from "@/components/analytics/TransactionsPopup";
import MonthSelector from "@/components/analytics/MonthSelector";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/bankStatement";

const Analytics = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  const { data: bankStatements, isLoading } = useQuery({
    queryKey: ["bank-statement-analytics"],
    queryFn: async () => {
      console.log('Fetching bank statements for analytics');
      const { data, error } = await supabase
        .from("bank_statement_data")
        .select(`
          *,
          financial_documents(
            file_name,
            upload_date,
            status
          )
        `)
        .order('statement_month', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Process transactions data for the selected month
  const processTransactionsData = () => {
    if (!bankStatements || bankStatements.length === 0) return [];

    // Filter statement by selected month
    const selectedStatement = selectedMonth 
      ? bankStatements.find(statement => statement.statement_month === selectedMonth)
      : bankStatements[0]; // Default to most recent if none selected

    if (!selectedStatement) return [];

    const transactions = selectedStatement.transactions as unknown as Transaction[] || [];

    // Group transactions by category and calculate totals (only expenses)
    const categoryTotals = transactions.reduce((acc: { [key: string]: number }, transaction) => {
      if (transaction.amount < 0) { // Only include expenses
        const category = transaction.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
      }
      return acc;
    }, {});

    // Convert to chart data format and sort by amount
    return Object.entries(categoryTotals)
      .map(([category, value]) => ({
        name: category,
        value,
        color: getCategoryColor(category),
        transactions: transactions.filter(t => t.category === category && t.amount < 0)
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Transportation': '#60A5FA',
      'Food & Dining': '#34D399',
      'Shopping': '#F472B6',
      'Entertainment': '#FB923C',
      'Bills & Utilities': '#A78BFA',
      'Business': '#67E8F9',
      'Uncategorized': '#94A3B8'
    };
    return colors[category] || '#94A3B8';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const data = processTransactionsData();
  const selectedData = data.find(item => item.name === selectedCategory);
  const totalSpending = data.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-center h-[500px]">
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const currentStatement = selectedMonth 
    ? bankStatements?.find(statement => statement.statement_month === selectedMonth)
    : bankStatements?.[0];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-800 dark:text-white mb-2">
          Spending Analytics
        </h1>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-neutral-600 dark:text-neutral-300">
            Total Spending: {formatCurrency(totalSpending)}
          </p>
          {bankStatements && bankStatements.length > 0 && (
            <MonthSelector
              statements={bankStatements}
              selectedMonth={selectedMonth}
              onMonthSelect={setSelectedMonth}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Spending Distribution
              {currentStatement && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  for {format(new Date(currentStatement.statement_month), "MMMM yyyy")}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full">
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
                    onClick={(data) => setSelectedCategory(data.name)}
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

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#888888"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          className="text-xs"
                        >
                          {`${percent}%`}
                        </text>
                      );
                    }}
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
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend 
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    formatter={(value, entry) => {
                      const item = data.find(d => d.name === value);
                      if (item) {
                        return `${value} (${formatCurrency(item.value)})`;
                      }
                      return value;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedData && (
        <TransactionsPopup
          isOpen={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          category={selectedData.name}
          transactions={selectedData.transactions}
          color={selectedData.color}
        />
      )}
    </div>
  );
};

export default Analytics;