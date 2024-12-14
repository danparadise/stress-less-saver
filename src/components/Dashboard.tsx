import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet, TrendingUp, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const mockData = {
  balance: 5240.50,
  income: 3200,
  expenses: 1850,
  savings: 450,
  transactions: [
    { date: "2024-01", amount: 3200 },
    { date: "2024-02", amount: 3400 },
    { date: "2024-03", amount: 3100 },
    { date: "2024-04", amount: 3600 },
  ]
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background p-6 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-neutral-800">Financial Overview</h1>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-8 bg-white/50 backdrop-blur-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 glass-card animate-fadeIn hover:translate-y-[-4px] transition-transform duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                <h2 className="text-2xl font-bold">${mockData.balance.toLocaleString()}</h2>
              </div>
              <div className="h-8 w-8 rounded-full bg-sage-100 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-sage-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6 glass-card animate-fadeIn [animation-delay:200ms] hover:translate-y-[-4px] transition-transform duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
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
                <p className="text-sm font-medium text-muted-foreground">Monthly Expenses</p>
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
                <p className="text-sm font-medium text-muted-foreground">Monthly Savings</p>
                <h2 className="text-2xl font-bold text-sage-500">
                  +${mockData.savings.toLocaleString()}
                </h2>
              </div>
              <div className="h-8 w-8 rounded-full bg-sage-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-sage-500" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-2 p-6 glass-card">
            <h3 className="text-lg font-semibold mb-4">Income Trend</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockData.transactions}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" />
                  <YAxis />
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
            <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
            <div className="space-y-4">
              <div className="p-4 bg-sage-50 rounded-lg">
                <p className="text-sm text-sage-700">
                  Based on your spending patterns, you could save an additional $200 monthly by reducing dining out expenses.
                </p>
              </div>
              <div className="p-4 bg-sage-50 rounded-lg">
                <p className="text-sm text-sage-700">
                  Your utility bills are 15% higher than average. Consider energy-efficient alternatives.
                </p>
              </div>
              <div className="p-4 bg-sage-50 rounded-lg">
                <p className="text-sm text-sage-700">
                  You're on track to reach your savings goal by September 2024.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;