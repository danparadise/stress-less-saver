import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthSelectorProps {
  statements: Array<{ statement_month: string }>;
  selectedMonth: string | null;
  onMonthSelect: (month: string) => void;
}

const MonthSelector = ({ statements, selectedMonth, onMonthSelect }: MonthSelectorProps) => {
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
          {statements
            .sort((a, b) => new Date(b.statement_month).getTime() - new Date(a.statement_month).getTime())
            .map((statement) => (
              <SelectItem 
                key={statement.statement_month} 
                value={statement.statement_month}
              >
                {format(new Date(statement.statement_month), "MMMM yyyy")}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MonthSelector;