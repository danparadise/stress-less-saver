import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BankStatementCharts from "@/components/bankstatements/analytics/BankStatementCharts";
import BankStatementInsights from "@/components/bankstatements/analytics/BankStatementInsights";
import BankStatementCategories from "@/components/bankstatements/analytics/BankStatementCategories";
import { BankStatement, Transaction } from "@/types/bankStatement";
import { Json } from "@/integrations/supabase/types";

// Helper function to convert Json to Transaction
const convertJsonToTransaction = (jsonData: any): Transaction => {
  return {
    date: String(jsonData?.date || ''),
    description: String(jsonData?.description || ''),
    category: String(jsonData?.category || ''),
    amount: Number(jsonData?.amount || 0),
    balance: Number(jsonData?.balance || 0)
  };
};

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
      
      const bankStatement: BankStatement = {
        id: data.id,
        document_id: data.document_id,
        statement_month: data.statement_month,
        total_deposits: data.total_deposits || 0,
        total_withdrawals: data.total_withdrawals || 0,
        ending_balance: data.ending_balance || 0,
        transactions: Array.isArray(data.transactions) 
          ? data.transactions.map(convertJsonToTransaction)
          : [],
        created_at: data.created_at,
        financial_documents: {
          file_name: data.financial_documents.file_name,
          upload_date: data.financial_documents.upload_date,
          status: data.financial_documents.status
        }
      };
      
      console.log('Processed bank statement data:', bankStatement);
      return bankStatement;
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

      <div className="space-y-8 max-w-[1400px] mx-auto">
        {/* Transaction Overview Section - Full Width */}
        <div className="w-full">
          <BankStatementCharts statement={statement} />
        </div>

        {/* Two Column Layout for Categories and Insights */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Spending Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <BankStatementCategories transactions={statement.transactions} />
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Financial Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <BankStatementInsights statement={statement} />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BankStatementAnalytics;