import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SearchBar from "./dashboard/SearchBar";
import StatsCard from "./dashboard/StatsCard";
import IncomeChart from "./dashboard/IncomeChart";
import AiInsights from "./dashboard/AiInsights";

const Dashboard = () => {
  const [isDark, setIsDark] = useState(false);

  const { data: bankStatements } = useQuery({
    queryKey: ["dashboard-bank-statements"],
    queryFn: async () => {
      console.log('Fetching bank statement data for dashboard');
      const { data: statements, error } = await supabase
        .from("bank_statement_data")
        .select(`
          *,
          financial_documents!inner(
            file_name,
            upload_date,
            status,
            id,
            document_type
          )
        `)
        .eq('financial_documents.document_type', 'bank_statement')
        .order('statement_month', { ascending: false });

      if (error) throw error;
      return statements;
    },
  });

  // Fetch paystub data
  const { data: paystubs } = useQuery({
    queryKey: ["dashboard-paystubs"],
    queryFn: async () => {
      console.log('Fetching paystub data for dashboard');
      const { data: stubs, error } = await supabase
        .from("paystub_data")
        .select(`
          *,
          financial_documents!inner(
            file_name,
            upload_date,
            status,
            id,
            document_type
          )
        `)
        .order('pay_period_end', { ascending: false });

      if (error) throw error;
      return stubs;
    },
  });

  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Searching:", e.target.value);
  };

  // Calculate current balance from latest bank statement
  const currentBalance = bankStatements?.[0]?.ending_balance || 0;

  // Calculate monthly income from latest paystub
  const monthlyIncome = paystubs?.[0]?.gross_pay || 0;

  // Calculate monthly expenses from latest bank statement
  const monthlyExpenses = bankStatements?.[0]?.total_withdrawals || 0;

  // Calculate monthly savings (income - expenses)
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsGoal = 1000; // This could be made configurable in the future

  // Prepare income trend data from paystubs - now in ascending order
  const incomeData = paystubs?.slice(0, 4).map(paystub => ({
    date: new Date(paystub.pay_period_end).toISOString().slice(0, 7),
    amount: Number(paystub.gross_pay) || 0
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  const generateAiSuggestions = () => {
    const suggestions = [];

    if (monthlySavings < 0) {
      suggestions.push({
        id: 1,
        tip: "Your expenses exceed your income. Consider reviewing your spending habits.",
        category: "budget"
      });
    }

    if (monthlyExpenses > monthlyIncome * 0.7) {
      suggestions.push({
        id: 2,
        tip: "Your expenses are over 70% of your income. Look for areas to reduce spending.",
        category: "expenses"
      });
    }

    const savingsRate = (monthlySavings / monthlyIncome) * 100;
    if (savingsRate < 20) {
      suggestions.push({
        id: 3,
        tip: "Your savings rate is below 20%. Try to increase your savings for better financial health.",
        category: "savings"
      });
    }

    return suggestions;
  };

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Current Balance"
              value={`$${currentBalance.toLocaleString()}`}
              icon={Wallet}
              iconBgColor="bg-sage-100"
              iconColor="text-sage-500"
            />
            <StatsCard
              title="Monthly Income"
              value={`+$${monthlyIncome.toLocaleString()}`}
              icon={ArrowUpRight}
              iconBgColor="bg-sage-100"
              iconColor="text-sage-500"
              valueColor="text-sage-500"
            />
            <StatsCard
              title="Monthly Expenses"
              value={`-$${monthlyExpenses.toLocaleString()}`}
              icon={ArrowDownRight}
              iconBgColor="bg-destructive/10"
              iconColor="text-destructive"
              valueColor="text-destructive"
            />
            <StatsCard
              title="Monthly Savings"
              value={`+$${monthlySavings.toLocaleString()}`}
              icon={PiggyBank}
              iconBgColor="bg-sage-100"
              iconColor="text-sage-500"
              valueColor="text-sage-500"
              progress={(monthlySavings / savingsGoal) * 100}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <IncomeChart data={incomeData} />
            </div>
            <div className="lg:col-span-1">
              <AiInsights suggestions={generateAiSuggestions()} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
