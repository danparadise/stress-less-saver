import { format, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Statement {
  month_year: string;
  total_income: number;
  total_expenses: number;
  total_deposits: number;
  ending_balance: number;
}

interface MonthSelectorProps {
  statements: Statement[];
  selectedMonth: string | null;
  onMonthSelect: (month: string) => void;
}

const MonthSelector = ({ statements, selectedMonth, onMonthSelect }: MonthSelectorProps) => {
  // Filter out any null or undefined month_year values and sort them from newest to oldest
  const uniqueMonths = Array.from(new Set(statements
    .filter(s => s.month_year && 
      // Filter out months that have no data
      (s.total_income > 0 || s.total_expenses > 0 || s.total_deposits > 0 || s.ending_balance !== 0)
    )
    .map(s => s.month_year)))
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
          {uniqueMonths.length > 0 ? (
            uniqueMonths.map((month) => (
              <SelectItem 
                key={month} 
                value={month}
              >
                {format(parseISO(month), "MMMM yyyy")}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="" disabled>
              No financial data available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MonthSelector;