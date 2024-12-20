import { useEffect, useState } from "react";
import { ArrowDownRight, PiggyBank, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./dashboard/SearchBar";
import StatsCard from "./dashboard/StatsCard";
import IncomeChart from "./dashboard/IncomeChart";
import AiInsights from "./dashboard/AiInsights";
import DashboardHeader from "./dashboard/DashboardHeader";
import FinancialChatbot from "./dashboard/FinancialChatbot";
import TransactionsPopup from "./analytics/TransactionsPopup";
import { useBankStatementData } from "@/hooks/useBankStatementData";
import { usePaystubTrends } from "@/hooks/usePaystubTrends";
import { supabase } from "@/integrations/supabase/client";

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
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);

  const { data: financialData, isLoading: isFinancialDataLoading } = useBankStatementData();
  const { data: paystubData, isLoading: isPaystubLoading, error } = usePaystubTrends();

  // Update monthly expenses when financial data changes
  useEffect(() => {
    if (financialData) {
      console.log('Processing financial data:', financialData);
      
      if ('total_withdrawals' in financialData && typeof financialData.total_withdrawals === 'number') {
        const withdrawals = Math.abs(financialData.total_withdrawals);
        console.log('Setting monthly expenses from withdrawals:', withdrawals);
        setMonthlyExpenses(withdrawals);
        
        // Set transactions if available
        if ('transactions' in financialData && Array.isArray(financialData.transactions)) {
          setTransactions(financialData.transactions);
        }
      }
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

  const handleExpensesClick = () => {
    navigate('/analytics');
  };

  const handleTransactionsClick = () => {
    setIsTransactionsOpen(true);
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
              <StatsCard
                title="Monthly Expenses"
                value={`-$${monthlyExpenses.toLocaleString()}`}
                icon={ArrowDownRight}
                iconBgColor="bg-destructive/10"
                iconColor="text-destructive"
                valueColor="text-destructive"
                onClick={handleExpensesClick}
              />
              <button
                onClick={handleTransactionsClick}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <List className="h-4 w-4" />
                View Transactions
              </button>
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

        {transactions && (
          <TransactionsPopup
            isOpen={isTransactionsOpen}
            onClose={() => setIsTransactionsOpen(false)}
            category="All Transactions"
            transactions={transactions}
            color="#ef4444"
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;