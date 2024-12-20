import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  valueColor?: string;
  progress?: number;
  onClick?: () => void;
}

const StatsCard = ({
  title,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  valueColor = "text-purple-800",
  progress,
  onClick
}: StatsCardProps) => {
  return (
    <Card 
      className={`p-6 glass-card animate-fadeIn hover:translate-y-[-4px] transition-transform duration-200 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-purple-600">{title}</p>
          <h2 className={`text-2xl font-bold ${valueColor}`}>{value}</h2>
        </div>
        <div className={`h-8 w-8 rounded-full ${iconBgColor} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      {progress !== undefined && (
        <>
          <div className="mt-4 h-2 bg-sage-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage-500 transition-all duration-500 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {progress}% of monthly goal
          </p>
        </>
      )}
    </Card>
  );
};

export default StatsCard;