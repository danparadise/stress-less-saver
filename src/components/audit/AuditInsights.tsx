import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Transaction } from "@/types/bankStatement";
import { convertJsonToTransaction } from "@/utils/transactionUtils";

interface AuditInsightsProps {
  selectedMonth: string | null;
}

const AuditInsights = ({ selectedMonth }: AuditInsightsProps) => {
  const { data: insights } = useQuery({
    queryKey: ["audit-insights", selectedMonth],
    queryFn: async () => {
      if (!selectedMonth) return null;

      const { data, error } = await supabase
        .from("monthly_financial_summaries")
        .select("*")
        .eq("month_year", selectedMonth)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Process transactions to find patterns
      const rawTransactions = Array.isArray(data.transactions) ? data.transactions : [];
      const transactions = rawTransactions.map(convertJsonToTransaction);
      const transactionMap = new Map();
      
      transactions.forEach((t: Transaction) => {
        const key = t.description;
        if (!transactionMap.has(key)) {
          transactionMap.set(key, {
            count: 1,
            total: Math.abs(t.amount),
            category: t.category
          });
        } else {
          const current = transactionMap.get(key);
          transactionMap.set(key, {
            count: current.count + 1,
            total: current.total + Math.abs(t.amount),
            category: t.category
          });
        }
      });

      // Convert to array and sort by frequency
      const frequentTransactions = Array.from(transactionMap.entries())
        .map(([description, stats]) => ({
          description,
          ...stats
        }))
        .sort((a, b) => b.count - a.count);

      return {
        frequentTransactions,
        categoryTotals: data.transaction_categories as Record<string, number>,
        totalExpenses: data.total_expenses || 0
      };
    },
    enabled: !!selectedMonth
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (!insights) {
    return <div className="text-muted-foreground">No insights available for the selected month</div>;
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-6">
        {insights.frequentTransactions.slice(0, 5).map((transaction, index) => (
          <div key={index} className="space-y-1">
            <h3 className="font-medium">{transaction.description}</h3>
            <p className="text-sm text-muted-foreground">
              Visited {transaction.count} times - Total spent: {formatCurrency(transaction.total)}
            </p>
          </div>
        ))}

        <div className="pt-4 border-t">
          <h3 className="font-medium mb-2">Top Spending Categories</h3>
          {Object.entries(insights.categoryTotals)
            .sort(([, a], [, b]) => Number(b) - Number(a))
            .slice(0, 3)
            .map(([category, amount], index) => (
              <div key={index} className="flex justify-between items-center py-1">
                <span className="text-sm">{category}</span>
                <span className="text-sm font-medium">{formatCurrency(Number(amount))}</span>
              </div>
            ))}
        </div>
      </div>
    </ScrollArea>
  );
};

export default AuditInsights;