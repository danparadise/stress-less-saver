import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BankStatementCharts from "@/components/bankstatements/analytics/BankStatementCharts";
import BankStatementInsights from "@/components/bankstatements/analytics/BankStatementInsights";
import BankStatementCategories from "@/components/bankstatements/analytics/BankStatementCategories";

const BankStatementAnalytics = () => {
  const { id } = useParams();

  const { data: statement, isLoading } = useQuery({
    queryKey: ["bank-statement", id],
    queryFn: async () => {
      console.log('Fetching bank statement data for ID:', id);
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
        .eq('id', id)
        .single();

      if (error) throw error;
      console.log('Fetched bank statement data:', data);
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!statement) {
    return <div>Statement not found</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-800 dark:text-white mb-2">
          Bank Statement Analytics
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Detailed analysis for {statement.financial_documents.file_name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <BankStatementCharts statement={statement} />
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <BankStatementCategories transactions={statement.transactions} />
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Financial Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <BankStatementInsights statement={statement} />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BankStatementAnalytics;