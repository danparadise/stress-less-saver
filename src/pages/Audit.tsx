import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AuditSummary from "@/components/audit/AuditSummary";
import AuditInsights from "@/components/audit/AuditInsights";
import AuditAlerts from "@/components/audit/AuditAlerts";
import AuditCharts from "@/components/audit/AuditCharts";
import AuditDocuments from "@/components/audit/AuditDocuments";
import MonthSelector from "@/components/analytics/MonthSelector";
import { useState } from "react";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading audit data...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Financial Audit</h1>
          <MonthSelector
            statements={statements || []}
            selectedMonth={selectedMonth}
            onMonthSelect={setSelectedMonth}
          />
        </div>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditSummary selectedMonth={selectedMonth} />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <AuditInsights selectedMonth={selectedMonth} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <AuditAlerts selectedMonth={selectedMonth} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditCharts selectedMonth={selectedMonth} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
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