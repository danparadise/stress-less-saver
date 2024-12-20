import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import TransactionsPopup from "@/components/analytics/TransactionsPopup";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Transaction } from "@/types/bankStatement";

const Analytics = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: latestStatement } = useQuery({
    queryKey: ["latest-bank-statement"],
    queryFn: async () => {
      console.log('Fetching latest bank statement data');
      const { data, error } = await supabase
        .from("bank_statement_data")
        .select(`
          *,
          financial_documents!inner(
            file_name,
            upload_date,
            status
          )
        `)
        .order('statement_month', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      console.log('Latest statement data:', data);
      return data;
    }
  });

  // Process transactions into category data for the chart
  const categoryData = latestStatement?.transactions 
    ? (latestStatement.transactions as Transaction[]).reduce((acc: any[], transaction: Transaction) => {
        if (transaction.amount < 0) { // Only include expenses (negative amounts)
          const category = transaction.category || 'Uncategorized';
          const existingCategory = acc.find(item => item.name === category);
          
          if (existingCategory) {
            existingCategory.value += Math.abs(transaction.amount);
            existingCategory.transactions.push(transaction);
          } else {
            acc.push({
              name: category,
              value: Math.abs(transaction.amount),
              color: getColorForCategory(category),
              transactions: [transaction]
            });
          }
        }
        return acc;
      }, [])
    : [];

  const selectedData = categoryData.find(item => item.name === selectedCategory);

  const handlePieClick = (data: any) => {
    setSelectedCategory(data.name);
  };

  // Get a consistent color for each category
  function getColorForCategory(category: string) {
    const colors: Record<string, string> = {
      'Transportation': '#60A5FA',
      'Business': '#67E8F9',
      'Food & Dining': '#86EFAC',
      'Shopping': '#F472B6',
      'Entertainment': '#FB923C',
      'Utilities': '#818CF8',
      'Housing': '#A78BFA',
      'Healthcare': '#34D399',
      'Insurance': '#F87171',
      'Uncategorized': '#94A3B8'
    };
    return colors[category] || '#94A3B8'; // Default color for unknown categories
  }

  if (!latestStatement) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-800 dark:text-white mb-2">
            Spending Analytics
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            No bank statement data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-800 dark:text-white mb-2">
          Spending Analytics
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Statement Period: {format(new Date(latestStatement.statement_month), "MMMM yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey="value"
                    onClick={handlePieClick}
                    cursor="pointer"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        className="transition-opacity hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend 
                    onClick={(entry) => handlePieClick(entry)}
                    cursor="pointer"
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