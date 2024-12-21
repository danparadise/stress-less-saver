import { Card } from "@/components/ui/card";

interface Suggestion {
  id: number;
  tip: string;
  category: string;
}

interface AiInsightsProps {
  suggestions: Suggestion[];
}

const AiInsights = ({ suggestions }: AiInsightsProps) => {
  return (
    <Card className="bg-white h-full p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold text-purple-900 mb-6">AI Insights</h2>
      <div className="space-y-4 h-[calc(100%-4rem)] overflow-y-auto">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-4 bg-purple-50 rounded-xl text-purple-900 transition-all duration-200 hover:bg-purple-100"
          >
            {suggestion.tip}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AiInsights;