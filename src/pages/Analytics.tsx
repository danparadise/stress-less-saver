import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/bankStatement";
import TransactionsPopup from "@/components/analytics/TransactionsPopup";
import MonthSelector from "@/components/analytics/MonthSelector";
import SpendingDistributionChart from "@/components/analytics/SpendingDistributionChart";
import CashFlowChart from "@/components/analytics/CashFlowChart";

const Analytics = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  const { data: statements, isLoading } = useQuery({
    queryKey: ["bank-statement-analytics"],
    queryFn: async () => {
      console.log('Fetching monthly summaries for analytics');
      const { data, error } = await supabase
        .from("monthly_financial_summaries")
        .select("*")
        .not('transactions', 'is', null)
        .neq('transactions', '[]')
        .order('month_year', { ascending: false });

      if (error) throw error;
      console.log('Fetched monthly summaries:', data);
      return data;
    }
  });

  const processTransactionsData = () => {
    if (!statements || statements.length === 0) return [];

    const selectedStatement = selectedMonth 
      ? statements.find(statement => statement.month_year === selectedMonth)
      : statements[0];

    if (!selectedStatement) return [];

    const transactions = selectedStatement.transactions as unknown as Transaction[] || [];

    const categoryTotals = transactions.reduce((acc: { [key: string]: number }, transaction) => {
      if (transaction.amount < 0) {
        const category = transaction.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
      }
      return acc;
    }, {});

    return Object.entries(categoryTotals)
      .map(([category, value]) => ({
        name: category,
        value,
        color: getCategoryColor(category),
        transactions: transactions.filter(t => t.category === category && t.amount < 0)
      }))
      .sort((a, b) => b.value - a.value);
  };

  const processCashFlowData = () => {
    if (!statements || statements.length === 0) return [];

    const selectedStatement = selectedMonth 
      ? statements.find(statement => statement.month_year === selectedMonth)
      : statements[0];

    if (!selectedStatement) return [];

    const transactions = selectedStatement.transactions as unknown as Transaction[] || [];

    return transactions
      .map(transaction => ({
        date: transaction.date,
        amount: transaction.amount,
        type: transaction.amount > 0 ? 'income' as const : 'expense' as const,
        description: transaction.description
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
  const cashFlowData = processCashFlowData();
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
    ? statements?.find(statement => statement.month_year === selectedMonth)
    : statements?.[0];

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
          {statements && statements.length > 0 && (
            <MonthSelector
              statements={statements}
              selectedMonth={selectedMonth}
              onMonthSelect={setSelectedMonth}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <SpendingDistributionChart
          data={data}
          totalSpending={totalSpending}
          currentMonth={currentStatement?.month_year || null}
          onCategoryClick={setSelectedCategory}
        />

        <CashFlowChart
          data={cashFlowData}
          currentMonth={currentStatement?.month_year || null}
        />
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
