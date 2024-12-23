import { format, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthSelectorProps {
  statements: Array<{
    month_year: string;
    total_income?: number;
    total_expenses?: number;
    total_deposits?: number;
    ending_balance?: number;
  }>;
  selectedMonth: string | null;
  onMonthSelect: (month: string) => void;
}

const MonthSelector = ({ statements, selectedMonth, onMonthSelect }: MonthSelectorProps) => {
  // Filter out months with no data and combine duplicates
  const monthsWithData = statements.reduce((acc, statement) => {
    const hasData = 
      (statement.total_income && statement.total_income > 0) ||
      (statement.total_expenses && statement.total_expenses > 0) ||
      (statement.total_deposits && statement.total_deposits > 0) ||
      (statement.ending_balance && statement.ending_balance !== 0);

    if (hasData) {
      // Use month_year as key to combine duplicates
      if (!acc.has(statement.month_year)) {
        acc.set(statement.month_year, statement);
      } else {
        // If duplicate exists, combine the data taking non-zero values
        const existing = acc.get(statement.month_year);
        acc.set(statement.month_year, {
          ...existing,
          total_income: statement.total_income || existing.total_income,
          total_expenses: statement.total_expenses || existing.total_expenses,
          total_deposits: statement.total_deposits || existing.total_deposits,
          ending_balance: statement.ending_balance || existing.ending_balance,
        });
      }
    }
    return acc;
  }, new Map());

  // Convert back to array and sort from newest to oldest
  const uniqueMonths = Array.from(monthsWithData.keys())
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (uniqueMonths.length === 0) {
    return (
      <div className="w-[200px]">
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="No data available" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no-data">No months available</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="w-[200px]">
      <Select
        value={selectedMonth || uniqueMonths[0]}
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
              {format(parseISO(month), "MMMM yyyy")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MonthSelector;