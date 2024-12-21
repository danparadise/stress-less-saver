import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthSelectorProps {
  statements: Array<{ month_year: string }>;
  selectedMonth: string | null;
  onMonthSelect: (month: string) => void;
}

const MonthSelector = ({ statements, selectedMonth, onMonthSelect }: MonthSelectorProps) => {
  // Remove duplicate months and sort them from newest to oldest
  const uniqueMonths = Array.from(new Set(statements.map(s => s.month_year)))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div className="w-[200px]">
      <Select
        value={selectedMonth || ""}
        onValueChange={onMonthSelect}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select month" />
        </SelectTrigger>
        <SelectContent>
          {uniqueMonths.map((month) => (
            <SelectItem 
              key={month} 
              value={month}
            >
              {format(new Date(month), "MMMM yyyy")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MonthSelector;