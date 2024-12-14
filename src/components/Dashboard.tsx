import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank } from "lucide-react";
import Header from "./dashboard/Header";
import SearchBar from "./dashboard/SearchBar";
import StatsCard from "./dashboard/StatsCard";
import IncomeChart from "./dashboard/IncomeChart";
import AiInsights from "./dashboard/AiInsights";

const mockData = {
  balance: 5240.50,
  income: 3200,
  expenses: 1850,
  savings: 450,
  savingsGoal: 1000,
  transactions: [
    { date: "2024-01", amount: 3200 },
    { date: "2024-02", amount: 3400 },
    { date: "2024-03", amount: 3100 },
    { date: "2024-04", amount: 3600 },
  ],
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
  const [isDark, setIsDark] = useState(false);

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

  const calculateSavingsProgress = () => {
    return (mockData.savings / mockData.savingsGoal) * 100;
  };

  return (
    <div className="min-h-screen bg-background p-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />
        
        <main className="pt-4">
          <SearchBar onSearch={handleSearch} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <StatsCard
              title="Current Balance"
              value={`$${mockData.balance.toLocaleString()}`}
              icon={Wallet}
              iconBgColor="bg-sage-100"
              iconColor="text-sage-500"
            />
            <StatsCard
              title="Monthly Income"
              value={`+$${mockData.income.toLocaleString()}`}
              icon={ArrowUpRight}
              iconBgColor="bg-sage-100"
              iconColor="text-sage-500"
              valueColor="text-sage-500"
            />
            <StatsCard
              title="Monthly Expenses"
              value={`-$${mockData.expenses.toLocaleString()}`}
              icon={ArrowDownRight}
              iconBgColor="bg-destructive/10"
              iconColor="text-destructive"
              valueColor="text-destructive"
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            <IncomeChart data={mockData.transactions} />
            <AiInsights suggestions={mockData.aiSuggestions} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;