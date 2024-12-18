import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { BankStatement, Transaction } from "@/types/bankStatement";

interface BankStatementInsightsProps {
  statement: BankStatement;
}

const BankStatementInsights = ({ statement }: BankStatementInsightsProps) => {
  const transactions = statement.transactions || [];
  
  // Calculate insights
  const totalIncome = transactions.reduce((sum: number, t: Transaction) => 
    t.amount > 0 ? sum + t.amount : sum, 0);
  
  const totalExpenses = Math.abs(transactions.reduce((sum: number, t: Transaction) => 
    t.amount < 0 ? sum + t.amount : sum, 0));
  
  const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
  
  // Group expenses by category
  const expensesByCategory = transactions
    .filter((t: Transaction) => t.amount < 0)
    .reduce((acc: Record<string, number>, t: Transaction) => {
      const category = t.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + Math.abs(t.amount);
      return acc;
    }, {});
  
  // Find highest expense category
  const highestExpenseCategory = Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => b - a)[0];

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Savings Rate</AlertTitle>
        <AlertDescription>
          Your savings rate for this period is {savingsRate.toFixed(1)}%. 
          {savingsRate > 20 
            ? " Great job on saving!" 
            : " Consider setting aside more for savings."}
        </AlertDescription>
      </Alert>

      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertTitle>Income Overview</AlertTitle>
        <AlertDescription>
          Total income for this period: ${totalIncome.toFixed(2)}
        </AlertDescription>
      </Alert>

      <Alert>
        <TrendingDown className="h-4 w-4" />
        <AlertTitle>Expense Analysis</AlertTitle>
        <AlertDescription>
          Total expenses: ${totalExpenses.toFixed(2)}
          <br />
          Highest spending category: {highestExpenseCategory?.[0]} (${highestExpenseCategory?.[1].toFixed(2)})
        </AlertDescription>
      </Alert>

      <Alert>
        <DollarSign className="h-4 w-4" />
        <AlertTitle>Recommendations</AlertTitle>
        <AlertDescription>
          {savingsRate < 20 && "Consider reducing spending in your highest expense category."}
          {savingsRate >= 20 && savingsRate < 30 && "You're on track with savings, but there's room for improvement."}
          {savingsRate >= 30 && "Excellent savings rate! Consider investing any excess savings."}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BankStatementInsights;