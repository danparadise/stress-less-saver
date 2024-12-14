import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AiSuggestion {
  id: number;
  tip: string;
  category: string;
}

interface AiInsightsProps {
  suggestions: AiSuggestion[];
}

const AiInsights = ({ suggestions }: AiInsightsProps) => {
  const { toast } = useToast();

  return (
    <Card className="p-6 glass-card">
      <h3 className="text-lg font-semibold text-purple-800 mb-4">AI Insights</h3>
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <div 
            key={suggestion.id}
            className="p-4 bg-sage-50 rounded-lg hover:bg-sage-100 transition-colors cursor-pointer"
            onClick={() => toast({
              title: "AI Insight",
              description: suggestion.tip,
            })}
          >
            <p className="text-sm text-purple-700">{suggestion.tip}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AiInsights;