import { Insight } from "@/utils/insightGenerator";

interface InsightCardProps {
  insight: Insight;
}

const InsightCard = ({ insight }: InsightCardProps) => {
  return (
    <div
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
  );
};

export default InsightCard;