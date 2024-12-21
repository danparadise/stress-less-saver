import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface Insight {
  id: string;
  tip: string;
  category: string;
}

const generateInsights = (summary: any): Insight[] => {
  const insights: Insight[] = [];
  
  if (!summary) return insights;

  // Calculate savings rate
  const savingsRate = summary.total_income > 0 
    ? ((summary.total_income - summary.total_expenses) / summary.total_income) * 100 
    : 0;

  // Add savings insight
  insights.push({
    id: 'savings-rate',
    tip: `Your current savings rate is ${savingsRate.toFixed(1)}%. ${
      savingsRate < 20 
        ? 'Consider setting aside more for savings.' 
        : 'Great job on maintaining a healthy savings rate!'
    }`,
    category: 'savings'
  });

  // Analyze spending categories
  if (summary.transaction_categories) {
    const categories = Object.entries(summary.transaction_categories)
      .sort(([, a]: any, [, b]: any) => b - a);

    if (categories.length > 0) {
      const [topCategory, topAmount] = categories[0];
      insights.push({
        id: 'top-spending',
        tip: `Your highest spending category is ${topCategory} at $${Number(topAmount).toFixed(2)}. ${
          topAmount > summary.total_income * 0.3 
            ? 'This might be an area to review for potential savings.' 
            : 'This appears to be within a reasonable range.'
        }`,
        category: 'spending'
      });
    }
  }

  // Income trend analysis
  if (summary.paystub_data && Array.isArray(summary.paystub_data) && summary.paystub_data.length > 0) {
    const totalIncome = summary.total_income;
    const avgMonthlyExpenses = summary.total_expenses;
    
    insights.push({
      id: 'income-expenses',
      tip: `Your monthly income is $${totalIncome.toFixed(2)} with expenses of $${avgMonthlyExpenses.toFixed(2)}. ${
        avgMonthlyExpenses > totalIncome * 0.9 
          ? 'Your expenses are close to your income. Consider reviewing your budget.' 
          : 'You\'re maintaining a good balance between income and expenses.'
      }`,
      category: 'budget'
    });
  }

  return insights;
};

const AiInsights = () => {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["latest-monthly-summary"],
    queryFn: async () => {
      console.log('Fetching latest monthly summary for insights');
      const { data: summaries, error } = await supabase
        .from("monthly_financial_summaries")
        .select("*")
        .order('month_year', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching monthly summary:', error);
        throw error;
      }

      console.log('Latest monthly summary:', summaries);
      return summaries;
    }
  });

  const insights = generateInsights(summary);

  if (isLoading) {
    return (
      <Card className="bg-white h-full p-6 rounded-xl shadow-md">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white h-full p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-purple-900 mb-6">AI Insights</h2>
      {insights.length > 0 ? (
        <div className="space-y-4 h-[calc(100%-4rem)] overflow-y-auto">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="p-4 bg-purple-50 rounded-xl text-purple-900 transition-all duration-200 hover:bg-purple-100"
            >
              {insight.tip}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[calc(100%-4rem)] text-gray-500">
          No insights available. Please upload some financial documents to get started.
        </div>
      )}
    </Card>
  );
};

export default AiInsights;