import { useEffect, useState } from "react";
import { ArrowDownRight, PiggyBank } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./dashboard/SearchBar";
import StatsCard from "./dashboard/StatsCard";
import IncomeChart from "./dashboard/IncomeChart";
import AiInsights from "./dashboard/AiInsights";
import DashboardHeader from "./dashboard/DashboardHeader";
import FinancialChatbot from "./dashboard/FinancialChatbot";
import { useBankStatementData } from "@/hooks/useBankStatementData";
import { usePaystubTrends } from "@/hooks/usePaystubTrends";
import { supabase } from "@/integrations/supabase/client";
import { calculateMonthlyExpenses } from "@/utils/transactionUtils";

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
      
      // If we have monthly summary data with total_expenses
      if (financialData.total_expenses !== undefined && financialData.total_expenses !== null) {
        console.log('Setting monthly expenses from summary:', financialData.total_expenses);
        setMonthlyExpenses(Math.abs(financialData.total_expenses));
      }
      // If we have total_withdrawals from bank statement
      else if (financialData.total_withdrawals !== undefined && financialData.total_withdrawals !== null) {
        console.log('Setting monthly expenses from withdrawals:', Math.abs(financialData.total_withdrawals));
        setMonthlyExpenses(Math.abs(financialData.total_withdrawals));
      }
      // Fallback to calculating from transactions
      else if (financialData.transactions) {
        console.log('Calculating monthly expenses from transactions');
        const calculatedExpenses = calculateMonthlyExpenses(financialData.transactions);
        console.log('Calculated monthly expenses:', calculatedExpenses);
        setMonthlyExpenses(calculatedExpenses);
      } else {
        console.log('No expense data available, setting to 0');
        setMonthlyExpenses(0);
      }
    }
  }, [financialData]);

  // Subscribe to financial summary changes
  useEffect(() => {
    const channel = supabase
      .channel('monthly-summary-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'monthly_financial_summaries'
        },
        (payload) => {
          console.log('Monthly summary updated:', payload);
          if (payload.new && 'total_expenses' in payload.new) {
            setMonthlyExpenses(Math.abs(payload.new.total_expenses));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
            <StatsCard
              title="Monthly Expenses"
              value={`-$${monthlyExpenses.toLocaleString()}`}
              icon={ArrowDownRight}
              iconBgColor="bg-destructive/10"
              iconColor="text-destructive"
              valueColor="text-destructive"
              onClick={handleExpensesClick}
            />
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