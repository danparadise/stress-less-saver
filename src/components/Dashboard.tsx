import { useEffect, useState } from "react";
import { ArrowDownRight, PiggyBank } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import SearchBar from "./dashboard/SearchBar";
import StatsCard from "./dashboard/StatsCard";
import IncomeChart from "./dashboard/IncomeChart";
import AiInsights from "./dashboard/AiInsights";

const mockData = {
  expenses: 1850,
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

  const { data: paystubData, isLoading, error } = useQuery({
    queryKey: ["paystub-data"],
    queryFn: async () => {
      console.log('Fetching paystub data for income trend');
      const { data, error } = await supabase
        .from("paystub_data")
        .select(`
          gross_pay,
          pay_period_start,
          financial_documents!inner(
            status,
            document_type
          )
        `)
        .eq('financial_documents.status', 'completed')
        .eq('financial_documents.document_type', 'paystub')
        .order('pay_period_start', { ascending: true });

      if (error) {
        console.error('Error fetching paystub data:', error);
        throw error;
      }
      
      // Transform and validate data for the chart
      const chartData = data?.map(item => ({
        date: item.pay_period_start,
        amount: Number(item.gross_pay)
      })).filter(item => 
        !isNaN(item.amount) && 
        item.date // Ensure we have a valid date
      ) || [];
      
      console.log('Transformed paystub data for chart:', chartData);
      return chartData;
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

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
              value={`-$${mockData.expenses.toLocaleString()}`}
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