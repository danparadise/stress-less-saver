import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";
import { addMonths, format, isWithin, startOfMonth } from "date-fns";

interface Insight {
  id: string;
  tip: string;
  category: string;
  type: 'positive' | 'warning' | 'suggestion';
}

const generateInsights = (summary: any): Insight[] => {
  const insights: Insight[] = [];
  
  if (!summary) return insights;

  // Calculate savings rate
  const savingsRate = Number(summary.total_income) > 0 
    ? ((Number(summary.total_income) - Number(summary.total_expenses)) / Number(summary.total_income)) * 100 
    : 0;

  // Add savings insight
  insights.push({
    id: 'savings-rate',
    tip: `Your current savings rate is ${savingsRate.toFixed(1)}%. ${
      savingsRate < 20 
        ? 'Consider setting aside more for savings.' 
        : 'Great job on maintaining a healthy savings rate!'
    }`,
    category: 'savings',
    type: savingsRate >= 20 ? 'positive' : 'warning'
  });

  // Analyze spending categories
  if (summary.transaction_categories) {
    const categories = Object.entries(summary.transaction_categories)
      .sort(([, a]: any, [, b]: any) => Number(b) - Number(a));

    if (categories.length > 0) {
      const [topCategory, topAmount] = categories[0];
      const spendingPercentage = (Number(topAmount) / Number(summary.total_income)) * 100;
      
      insights.push({
        id: 'top-spending',
        tip: `Your highest spending category is ${topCategory} at $${Number(topAmount).toFixed(2)} (${spendingPercentage.toFixed(1)}% of income). ${
          spendingPercentage > 30 
            ? 'This might be an area to review for potential savings.' 
            : 'This appears to be within a reasonable range.'
        }`,
        category: 'spending',
        type: spendingPercentage <= 30 ? 'positive' : 'warning'
      });

      // Check for subscription-like expenses
      const subscriptionCategories = ['Entertainment', 'Subscriptions', 'Streaming', 'Software'];
      const subscriptionTotal = categories
        .filter(([category]) => subscriptionCategories.some(sub => category.toLowerCase().includes(sub.toLowerCase())))
        .reduce((sum, [, amount]) => sum + Number(amount), 0);

      if (subscriptionTotal > 0) {
        insights.push({
          id: 'subscriptions',
          tip: `You're spending $${subscriptionTotal.toFixed(2)} on subscriptions. Consider reviewing these recurring expenses to identify any unused services.`,
          category: 'subscriptions',
          type: 'suggestion'
        });
      }
    }
  }

  // Holiday spending insight (show from October through December)
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 9 && currentMonth <= 11) {
    insights.push({
      id: 'holiday-planning',
      tip: "Holiday season is approaching! Based on your current spending patterns, consider setting aside extra funds for gifts and celebrations to avoid any financial stress.",
      category: 'planning',
      type: 'suggestion'
    });
  }

  // Cash flow analysis
  if (summary.transactions && Array.isArray(summary.transactions)) {
    const midMonthBalance = summary.transactions
      .filter((t: any) => new Date(t.date).getDate() === 15)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.balance;

    if (midMonthBalance && Number(midMonthBalance) < Number(summary.total_expenses) * 0.5) {
      insights.push({
        id: 'cash-flow',
        tip: "Your mid-month balance tends to run low. Consider spreading out major expenses throughout the month to maintain better cash flow.",
        category: 'cash-flow',
        type: 'warning'
      });
    }
  }

  // Income trend analysis
  if (summary.paystub_data && Array.isArray(summary.paystub_data) && summary.paystub_data.length > 0) {
    const latestPaystub = summary.paystub_data[summary.paystub_data.length - 1];
    const previousPaystub = summary.paystub_data[summary.paystub_data.length - 2];

    if (latestPaystub && previousPaystub) {
      const payIncrease = Number(latestPaystub.net_pay) - Number(previousPaystub.net_pay);
      if (payIncrease > 0) {
        insights.push({
          id: 'income-trend',
          tip: `Great news! Your latest paycheck increased by $${payIncrease.toFixed(2)}. Keep up the good work!`,
          category: 'income',
          type: 'positive'
        });
      }
    }
  }

  // Ensure at least one positive insight
  const hasPositive = insights.some(insight => insight.type === 'positive');
  if (!hasPositive) {
    insights.push({
      id: 'general-positive',
      tip: "You're taking control of your finances by tracking your expenses. That's a great first step toward financial wellness!",
      category: 'general',
      type: 'positive'
    });
  }

  return insights;
};

const AiInsights = () => {
  const queryClient = useQueryClient();
  const { data: summary, isLoading, refetch } = useQuery({
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
  const displayInsights = insights.slice(0, Math.max(3, insights.length));

  const handleRefresh = async () => {
    await refetch();
  };

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-purple-900">AI Insights</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Update Insights
        </Button>
      </div>
      {displayInsights.length > 0 ? (
        <div className="space-y-4 h-[calc(100%-4rem)] overflow-y-auto">
          {displayInsights.map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-xl transition-all duration-200 ${
                insight.type === 'positive' 
                  ? 'bg-green-50 text-green-900 hover:bg-green-100'
                  : insight.type === 'warning'
                  ? 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                  : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
              }`}
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