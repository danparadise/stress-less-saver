import { useEffect, useState } from "react";
import { ArrowDownRight, PiggyBank, List, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import SearchBar from "./dashboard/SearchBar";
import StatsCard from "./dashboard/StatsCard";
import IncomeChart from "./dashboard/IncomeChart";
import AiInsights from "./dashboard/AiInsights";
import DashboardHeader from "./dashboard/DashboardHeader";
import FinancialChatbot from "./dashboard/FinancialChatbot";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useBankStatementData } from "@/hooks/useBankStatementData";
import { usePaystubTrends } from "@/hooks/usePaystubTrends";

const mockData = {
  savings: 450,
  savingsGoal: 1000,
  aiSuggestions: [
    {
      id: 1,
      tip: "Based on your spending patterns, you could save an additional $200 monthly by reducing dining out expenses.",
      category: "dining"
    },
    {
      id: 2,
      tip: "Your utility bills are 15% higher than average. Consider energy-efficient alternatives.",
      category: "utilities"
    },
    {
      id: 3,
      tip: "You're on track to reach your savings goal by September 2024. Keep it up!",
      category: "savings"
    }
  ]
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);

  const { data: financialData, isLoading: isFinancialDataLoading } = useBankStatementData();
  const { data: paystubData, isLoading: isPaystubLoading, error } = usePaystubTrends();

  // Update monthly expenses when financial data changes
  useEffect(() => {
    if (financialData) {
      console.log('Processing financial data:', financialData);
      setMonthlyExpenses(Math.abs(financialData.total_withdrawals || 0));
    }
  }, [financialData]);

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Searching:", e.target.value);
  };

  const calculateSavingsProgress = () => {
    return (mockData.savings / mockData.savingsGoal) * 100;
  };

  const handleAnalyticsClick = () => {
    navigate('/analytics');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Error loading dashboard</h2>
          <p className="text-muted-foreground">Please refresh the page to try again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <DashboardHeader isDark={isDark} />

        <div className="space-y-8">
          <SearchBar onSearch={handleSearch} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="bg-card rounded-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-medium">Monthly Expenses</h3>
                    <p className="text-2xl font-bold text-destructive">
                      -{formatCurrency(monthlyExpenses)}
                    </p>
                  </div>
                  <div className="bg-destructive/10 p-2 rounded-full">
                    <ArrowDownRight className="h-5 w-5 text-destructive" />
                  </div>
                </div>

                <ScrollArea className="h-[300px] w-full rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData?.transactions.map((transaction, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {format(new Date(transaction.date), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell className={`text-right ${
                            transaction.amount < 0 ? 'text-destructive' : 'text-sage-500'
                          }`}>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(transaction.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={handleAnalyticsClick}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <BarChart2 className="h-4 w-4" />
                    View Analytics
                  </Button>
                </div>
              </div>
            </div>
            <StatsCard
              title="Monthly Savings"
              value={`+$${mockData.savings.toLocaleString()}`}
              icon={PiggyBank}
              iconBgColor="bg-sage-100"
              iconColor="text-sage-500"
              valueColor="text-sage-500"
              progress={calculateSavingsProgress()}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {isPaystubLoading ? (
                <div className="w-full h-[300px] bg-card rounded-lg animate-pulse" />
              ) : (
                <IncomeChart data={paystubData || []} />
              )}
            </div>
            <div className="lg:col-span-1">
              <AiInsights suggestions={mockData.aiSuggestions} />
            </div>
          </div>

          <div className="w-full">
            <FinancialChatbot />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;