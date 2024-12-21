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
    <Card className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-purple-900 mb-4">AI Insights</h2>
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-4 bg-purple-50 rounded-lg text-purple-900"
          >
            {suggestion.tip}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AiInsights;