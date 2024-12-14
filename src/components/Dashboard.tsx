import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, TrendingUp, Search, PiggyBank, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

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
  const { toast } = useToast();
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
    toast({
      title: isDark ? "Light mode activated" : "Dark mode activated",
      duration: 2000,
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Searching:", e.target.value);
  };

  const calculateSavingsProgress = () => {
    return (mockData.savings / mockData.savingsGoal) * 100;
  };

  return (
    <div className="min-h-screen bg-background p-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col items-center mb-8 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
            onClick={toggleDarkMode}
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          <div className="w-32 h-32 mb-4">
            <img
              src={isDark ? "/lovable-uploads/d6799270-a533-42b4-b766-bdd5482b3b0d.png" : "/lovable-uploads/c6bfa104-b34d-4f58-88e1-a76291298892.png"}
              alt="PayGuard Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-black dark:text-white">PayGuard</h1>
          <p className="text-black dark:text-sage-300 mt-2 italic">A Wise Way To Get Paid</p>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black dark:text-white">Financial Overview</h2>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-8 bg-white/50 backdrop-blur-sm"
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 glass-card animate-fadeIn hover:translate-y-[-4px] transition-transform duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-purple-600">Current Balance</p>
                <h2 className="text-2xl font-bold text-purple-800">${mockData.balance.toLocaleString()}</h2>
              </div>
              <div className="h-8 w-8 rounded-full bg-sage-100 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-sage-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 glass-card animate-fadeIn [animation-delay:200ms] hover:translate-y-[-4px] transition-transform duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-purple-600">Monthly Income</p>
                <h2 className="text-2xl font-bold text-sage-500">
                  +${mockData.income.toLocaleString()}
                </h2>
              </div>
              <div className="h-8 w-8 rounded-full bg-sage-100 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-sage-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 glass-card animate-fadeIn [animation-delay:400ms] hover:translate-y-[-4px] transition-transform duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-purple-600">Monthly Expenses</p>
                <h2 className="text-2xl font-bold text-destructive">
                  -${mockData.expenses.toLocaleString()}
                </h2>
              </div>
              <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              </div>
            </div>
          </Card>

          <Card className="p-6 glass-card animate-fadeIn [animation-delay:600ms] hover:translate-y-[-4px] transition-transform duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-purple-600">Monthly Savings</p>
                <h2 className="text-2xl font-bold text-sage-500">
                  +${mockData.savings.toLocaleString()}
                </h2>
              </div>
              <div className="h-8 w-8 rounded-full bg-sage-100 flex items-center justify-center">
                <PiggyBank className="h-4 w-4 text-sage-500" />
              </div>
            </div>
            <div className="mt-4 h-2 bg-sage-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sage-500 transition-all duration-500 ease-in-out"
                style={{ width: `${calculateSavingsProgress()}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {calculateSavingsProgress()}% of monthly goal
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-2 p-6 glass-card">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">Income Trend</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockData.transactions}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" stroke="#1E1533" />
                  <YAxis stroke="#1E1533" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#8CA891"
                    strokeWidth={2}
                    dot={{ fill: "#8CA891" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6 glass-card">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">AI Insights</h3>
            <div className="space-y-4">
              {mockData.aiSuggestions.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className="p-4 bg-sage-50 rounded-lg hover:bg-sage-100 transition-colors cursor-pointer"
                  onClick={() => toast({
                    title: "AI Insight",
                    description: suggestion.tip,
                  })}
                >
                  <p className="text-sm text-purple-700">{suggestion.tip}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;