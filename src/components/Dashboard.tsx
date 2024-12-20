import { useEffect, useState } from "react";
import { ArrowDownRight, PiggyBank } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./dashboard/SearchBar";
import StatsCard from "./dashboard/StatsCard";
import IncomeChart from "./dashboard/IncomeChart";
import AiInsights from "./dashboard/AiInsights";
import { useBankStatementData } from "@/hooks/useBankStatementData";
import { usePaystubTrends } from "@/hooks/usePaystubTrends";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/types/bankStatement";

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

  const { data: bankStatementData } = useBankStatementData();
  const { data: paystubData, isLoading, error } = usePaystubTrends();

  // Subscribe to bank statement changes and update monthly expenses
  useEffect(() => {
    const channel = supabase
      .channel('bank-statement-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bank_statement_data'
        },
        () => {
          // Refresh the monthly expenses when bank statement data changes
          if (bankStatementData?.transactions) {
            const transactionsArray = bankStatementData.transactions as Transaction[];
            const expenses = transactionsArray.reduce((total: number, transaction: Transaction) => {
              if (transaction.amount < 0) {
                return total + Math.abs(transaction.amount);
              }
              return total;
            }, 0);
            
            console.log('Updated monthly expenses:', expenses);
            setMonthlyExpenses(expenses);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bankStatementData]);

  // Initial calculation of monthly expenses
  useEffect(() => {
    if (bankStatementData?.transactions) {
      const transactionsArray = bankStatementData.transactions as Transaction[];
      const expenses = transactionsArray.reduce((total: number, transaction: Transaction) => {
        if (transaction.amount < 0) {
          return total + Math.abs(transaction.amount);
        }
        return total;
      }, 0);
      
      console.log('Calculated monthly expenses:', expenses);
      setMonthlyExpenses(expenses);
    }
  }, [bankStatementData]);

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
    console.error('Dashboard error:', error);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-purple-800 dark:text-white mb-2">
            Welcome back!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Take a look at your financial overview
          </p>
        </div>

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
              {isLoading ? (
                <div className="w-full h-[300px] bg-card rounded-lg animate-pulse" />
              ) : (
                <IncomeChart data={paystubData || []} />
              )}
            </div>
            <div className="lg:col-span-1">
              <AiInsights suggestions={mockData.aiSuggestions} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;