import { useState } from "react";
import SearchBar from "./dashboard/SearchBar";
import IncomeChart from "./dashboard/IncomeChart";
import AiInsights from "./dashboard/AiInsights";
import DashboardHeader from "./dashboard/DashboardHeader";
import FinancialChatbot from "./dashboard/FinancialChatbot";
import { useBankStatementData } from "@/hooks/useBankStatementData";
import { usePaystubTrends } from "@/hooks/usePaystubTrends";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const { data: financialData, isLoading: isFinancialDataLoading } = useBankStatementData();
  const { data: paystubData, isLoading: isPaystubLoading, error } = usePaystubTrends();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Searching:", e.target.value);
  };

  const handleUploadClick = () => {
    navigate("/bank-statements");
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

  const showUploadPrompt = !financialData;

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <DashboardHeader isDark={isDark} />
        
        <div className="space-y-6">
          <SearchBar onSearch={handleSearch} />

          {showUploadPrompt ? (
            <Card className="border-2 border-purple-200 dark:border-purple-900">
              <CardHeader>
                <CardTitle className="text-2xl text-purple-900 dark:text-purple-100">
                  Here's your financial snapshot:
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-lg text-purple-800 dark:text-purple-200">
                    I'm your AI financial assistant, ready to analyze your data and provide personalized advice. Let's take action!
                  </p>
                  
                  <div className="space-y-4 pl-6">
                    <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100">
                      Step 1: Get Started
                    </h3>
                    <ul className="list-disc space-y-3 text-purple-800 dark:text-purple-200">
                      <li>What to do: Share your financial documents to get started with personalized insights</li>
                      <li>Why: To receive tailored guidance based on your situation</li>
                      <li>How: Upload your bank statements and we'll analyze them for you</li>
                    </ul>
                  </div>

                  <div className="mt-6">
                    <Button
                      onClick={handleUploadClick}
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
                    >
                      <Upload className="mr-2 h-5 w-5" />
                      Upload Bank Statements
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-1 h-[500px]">
                  <FinancialChatbot />
                </div>
                <div className="lg:col-span-1 h-[500px]">
                  <AiInsights />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {!isPaystubLoading && (
                  <div className="w-full bg-white rounded-xl shadow-lg p-4">
                    <IncomeChart data={paystubData || []} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;