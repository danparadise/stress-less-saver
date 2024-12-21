import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";
import InsightCard from "./InsightCard";
import { generateInsights } from "@/utils/insightGenerator";

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
            <InsightCard key={insight.id} insight={insight} />
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