import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const Landing = () => {
  const navigate = useNavigate();

  // Force light mode on the landing page
  useEffect(() => {
    const root = window.document.documentElement;
    const originalTheme = root.classList.contains('dark') ? 'dark' : 'light';
    root.classList.remove('dark');
    return () => {
      if (originalTheme === 'dark') {
        root.classList.add('dark');
      }
    };
  }, []);

  // Sample data for spending distribution
  const spendingData = [
    { name: 'Housing', value: 2100 },
    { name: 'Transportation', value: 800 },
    { name: 'Food', value: 600 },
    { name: 'Entertainment', value: 400 },
    { name: 'Others', value: 1880 }
  ];

  // Sample data for cash flow
  const cashFlowData = [
    { date: 'Nov 30', amount: -320 },
    { date: 'Dec 02', amount: -120 },
    { date: 'Dec 04', amount: 280 },
    { date: 'Dec 06', amount: -180 },
    { date: 'Dec 08', amount: -80 },
    { date: 'Dec 10', amount: 380 },
    { date: 'Dec 12', amount: -280 }
  ];

  const COLORS = ['#8B5CF6', '#34D399', '#F472B6', '#0EA5E9', '#D946EF'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-purple-900 mb-6 animate-fadeIn">
            PayGuard AI
          </h1>
          <p className="text-2xl md:text-3xl text-purple-800 mb-8 animate-fadeIn delay-100">
            A Simple Way To Check Your Finances
          </p>
          <p className="text-lg md:text-xl text-purple-700 mb-12 animate-fadeIn delay-200">
            Empower your financial decisions with AI-driven insights. Track expenses, analyze patterns, and secure your financial future.
          </p>
          
          <div className="flex justify-center gap-4 animate-fadeIn delay-300">
            <Button
              onClick={() => navigate("/login")}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
            >
              Get Started Free
            </Button>
          </div>

          {/* Analytics Preview Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn delay-400">
            {/* Spending Distribution Chart */}
            <div className="p-8 rounded-xl bg-white shadow-lg">
              <h3 className="text-xl font-semibold mb-6 text-purple-900">Total Spending Distribution</h3>
              <div className="h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value}`}
                    >
                      {spendingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-900">$5,780</div>
                    <div className="text-sm text-purple-600">Total</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Flow Chart */}
            <div className="p-8 rounded-xl bg-white shadow-lg">
              <h3 className="text-xl font-semibold mb-6 text-purple-900">Cash Flow Analysis</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowData}>
                    <XAxis dataKey="date" />
                    <YAxis 
                      tickFormatter={(value) => `$${value}`}
                      domain={[-400, 400]}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill={(data: any) => data.amount >= 0 ? '#34D399' : '#F87171'}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left animate-fadeIn delay-500">
            <div className="p-6 rounded-lg bg-white/80 shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-purple-900">AI-Powered Analysis</h3>
              <p className="text-purple-700">Smart insights and patterns detection to help you make better financial decisions.</p>
            </div>
            <div className="p-6 rounded-lg bg-white/80 shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-purple-900">Secure & Private</h3>
              <p className="text-purple-700">Bank-level security to keep your financial data safe and protected.</p>
            </div>
            <div className="p-6 rounded-lg bg-white/80 shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-purple-900">Easy Integration</h3>
              <p className="text-purple-700">Seamlessly connect your financial documents and start analyzing in minutes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;