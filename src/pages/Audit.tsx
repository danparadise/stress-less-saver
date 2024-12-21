import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AuditSummary from "@/components/audit/AuditSummary";
import AuditInsights from "@/components/audit/AuditInsights";
import AuditAlerts from "@/components/audit/AuditAlerts";
import AuditCharts from "@/components/audit/AuditCharts";
import AuditDocuments from "@/components/audit/AuditDocuments";
import MonthSelector from "@/components/analytics/MonthSelector";
import { useState, useEffect } from "react";

const Audit = () => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const { data: statements, isLoading } = useQuery({
    queryKey: ["monthly-summaries"],
    queryFn: async () => {
      console.log('Fetching monthly summaries for audit');
      const { data, error } = await supabase
        .from("monthly_financial_summaries")
        .select("*")
        .order('month_year', { ascending: false });

      if (error) throw error;
      console.log('Monthly summaries:', data);
      return data;
    }
  });

  // Set the most recent month with data as the default selection
  useEffect(() => {
    if (statements && statements.length > 0 && !selectedMonth) {
      // Find the most recent month that has meaningful data
      const monthWithData = statements.find(statement => 
        (statement.total_income && statement.total_income > 0) ||
        (statement.total_expenses && statement.total_expenses > 0) ||
        (statement.total_deposits && statement.total_deposits > 0) ||
        (statement.ending_balance && statement.ending_balance !== 0)
      );

      if (monthWithData) {
        console.log('Setting default month:', monthWithData.month_year);
        setSelectedMonth(monthWithData.month_year);
      }
    }
  }, [statements]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[500px]">
            <p className="text-muted-foreground animate-pulse">Loading audit data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Financial Audit
          </h1>
          <MonthSelector
            statements={statements || []}
            selectedMonth={selectedMonth}
            onMonthSelect={setSelectedMonth}
          />
        </div>

        <div className="grid gap-6">
          <Card className="backdrop-blur-lg bg-card/50 border-purple-200/20">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800 dark:text-purple-100">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditSummary selectedMonth={selectedMonth} />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="backdrop-blur-lg bg-card/50 border-purple-200/20">
              <CardHeader>
                <CardTitle className="text-xl text-purple-800 dark:text-purple-100">Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <AuditInsights selectedMonth={selectedMonth} />
              </CardContent>
            </Card>

            <Card className="backdrop-blur-lg bg-card/50 border-purple-200/20">
              <CardHeader>
                <CardTitle className="text-xl text-purple-800 dark:text-purple-100">Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <AuditAlerts selectedMonth={selectedMonth} />
              </CardContent>
            </Card>
          </div>

          <Card className="backdrop-blur-lg bg-card/50 border-purple-200/20">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800 dark:text-purple-100">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditCharts selectedMonth={selectedMonth} />
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-card/50 border-purple-200/20">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800 dark:text-purple-100">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditDocuments selectedMonth={selectedMonth} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Audit;