import { useState } from "react";
import { PiggyBank } from "lucide-react";
import SearchBar from "./dashboard/SearchBar";
import StatsCard from "./dashboard/StatsCard";
import IncomeChart from "./dashboard/IncomeChart";
import AiInsights from "./dashboard/AiInsights";
import DashboardHeader from "./dashboard/DashboardHeader";
import FinancialChatbot from "./dashboard/FinancialChatbot";
import { useBankStatementData } from "@/hooks/useBankStatementData";
import { usePaystubTrends } from "@/hooks/usePaystubTrends";

const Dashboard = () => {
  const [isDark, setIsDark] = useState(false);
  const { data: financialData, isLoading: isFinancialDataLoading } = useBankStatementData();
  const { data: paystubData, isLoading: isPaystubLoading, error } = usePaystubTrends();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Searching:", e.target.value);
  };

  const calculateSavingsProgress = () => {
    if (!financialData) return 0;
    const savingsGoal = 1000; // This could be made dynamic in the future
    const savings = financialData.total_income - financialData.total_expenses;
    return (savings / savingsGoal) * 100;
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

  if (isFinancialDataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading financial data...</h2>
          <p className="text-muted-foreground">Please wait</p>
        </div>
      </div>
    );
  }

  const monthlySavings = financialData 
    ? Math.max(0, financialData.total_income - financialData.total_expenses)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <DashboardHeader isDark={isDark} />
        
        <div className="space-y-6">
          <SearchBar onSearch={handleSearch} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="lg:col-span-1 h-[500px]">
              <FinancialChatbot />
            </div>
            <div className="lg:col-span-1 h-[500px]">
              <AiInsights />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <StatsCard
              title="Monthly Savings"
              value={`+$${monthlySavings.toLocaleString()}`}
              icon={PiggyBank}
              iconBgColor="bg-sage-100"
              iconColor="text-sage-500"
              valueColor="text-sage-500"
              progress={calculateSavingsProgress()}
            />

            {!isPaystubLoading && (
              <div className="w-full bg-white rounded-xl shadow-lg p-4">
                <IncomeChart data={paystubData || []} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;