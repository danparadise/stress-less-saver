import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AuditSummaryProps {
  selectedMonth: string | null;
}

const AuditSummary = ({ selectedMonth }: AuditSummaryProps) => {
  const { data: summary } = useQuery({
    queryKey: ["audit-summary", selectedMonth],
    queryFn: async () => {
      if (!selectedMonth) return null;

      const { data, error } = await supabase
        .from("monthly_financial_summaries")
        .select("*")
        .eq("month_year", selectedMonth)
        .maybeSingle();

      if (error) throw error;
      return data;
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

  if (!summary) {
    return (
      <div className="text-muted-foreground text-center py-4">
        No financial data available for the selected month
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="p-6 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Income</h3>
        <p className="text-2xl font-bold text-purple-800 dark:text-purple-100">
          {formatCurrency(summary.total_income)}
        </p>
      </div>
      
      <div className="p-6 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Expenses</h3>
        <p className="text-2xl font-bold text-purple-800 dark:text-purple-100">
          {formatCurrency(summary.total_expenses)}
        </p>
      </div>
      
      <div className="p-6 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Net Balance</h3>
        <p className="text-2xl font-bold text-purple-800 dark:text-purple-100">
          {formatCurrency(summary.ending_balance)}
        </p>
      </div>
    </div>
  );
};

export default AuditSummary;