import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Transaction } from "@/types/bankStatement";
import { convertJsonToTransaction } from "@/utils/transactionUtils";

interface AuditAlertsProps {
  selectedMonth: string | null;
}

const AuditAlerts = ({ selectedMonth }: AuditAlertsProps) => {
  const { data: alerts } = useQuery({
    queryKey: ["audit-alerts", selectedMonth],
    queryFn: async () => {
      if (!selectedMonth) return null;

      // Get current month's data
      const { data: currentMonth, error: currentError } = await supabase
        .from("monthly_financial_summaries")
        .select("*")
        .eq("month_year", selectedMonth)
        .maybeSingle();

      if (currentError) throw currentError;
      if (!currentMonth) return null;

      // Get previous month's data for comparison
      const previousMonth = new Date(selectedMonth);
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      
      const { data: previousMonthData } = await supabase
        .from("monthly_financial_summaries")
        .select("*")
        .eq("month_year", previousMonth.toISOString().split('T')[0])
        .maybeSingle();

      const alerts = [];

      // Check for low balance
      if (currentMonth.ending_balance < 500) {
        alerts.push({
          type: "warning",
          title: "Low Balance Alert",
          description: `Your balance is below $500. Consider reducing non-essential expenses.`
        });
      }

      // Compare spending with previous month
      if (previousMonthData && currentMonth.total_expenses > previousMonthData.total_expenses * 1.2) {
        alerts.push({
          type: "warning",
          title: "Increased Spending",
          description: "Your spending this month is 20% higher than last month."
        });
      }

      // Check for high-value transactions
      const rawTransactions = Array.isArray(currentMonth.transactions) 
        ? currentMonth.transactions 
        : [];
      const transactions = rawTransactions.map(convertJsonToTransaction);
      
      const highValueTransactions = transactions
        .filter(t => Math.abs(t.amount) > 500)
        .map(t => ({
          type: "info",
          title: "Large Transaction",
          description: `${t.description}: ${new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(Math.abs(t.amount))}`
        }));

      return [...alerts, ...highValueTransactions];
    },
    enabled: !!selectedMonth
  });

  if (!alerts || alerts.length === 0) {
    return <div className="text-muted-foreground">No alerts for the selected month</div>;
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <Alert key={index}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        ))}
      </div>
    </ScrollArea>
  );
};

export default AuditAlerts;