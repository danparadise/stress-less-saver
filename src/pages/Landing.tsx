import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";
import Footer from "@/components/Footer";

const Landing = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const originalTheme = root.classList.contains('dark') ? 'dark' : 'light';
    root.classList.remove('dark');
    
    // Add a small delay to ensure smooth animation
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => {
      if (originalTheme === 'dark') {
        root.classList.add('dark');
      }
      clearTimeout(timer);
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
    { date: 'Nov 30', amount: -320, type: 'expense' },
    { date: 'Dec 02', amount: -120, type: 'expense' },
    { date: 'Dec 04', amount: 280, type: 'income' },
    { date: 'Dec 06', amount: -180, type: 'expense' },
    { date: 'Dec 08', amount: -80, type: 'expense' },
    { date: 'Dec 10', amount: 380, type: 'income' },
    { date: 'Dec 12', amount: -280, type: 'expense' }
  ];

  const COLORS = ['#8B5CF6', '#34D399', '#F472B6', '#0EA5E9', '#D946EF'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white overflow-hidden">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <h1 
            className={`text-5xl md:text-6xl font-bold text-purple-900 mb-6 transition-all duration-500 ease-out transform ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            PayGuard AI
          </h1>
          <p 
            className={`text-2xl md:text-3xl text-purple-800 mb-8 transition-all duration-500 ease-out delay-100 transform ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            A Simple Way To Check Your Finances
          </p>
          <p 
            className={`text-lg md:text-xl text-purple-700 mb-12 transition-all duration-500 ease-out delay-200 transform ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            Empower your financial decisions with AI-driven insights. Track expenses, analyze patterns, and secure your financial future.
          </p>
          
          <div 
            className={`flex justify-center gap-4 transition-all duration-500 ease-out delay-300 transform ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <Button
              onClick={() => setShowOnboarding(true)}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
            >
              Get Started Free
            </Button>
            <Button
              onClick={handleSignIn}
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg border-purple-600 text-purple-600 hover:bg-purple-50 bg-white hover:bg-white"
            >
              Sign In
            </Button>
          </div>

          <OnboardingDialog 
            open={showOnboarding} 
            onOpenChange={setShowOnboarding}
          />

          {/* Analytics Preview Section */}
          <div 
            className={`mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-500 ease-out delay-400 transform ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
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
                      labelLine={true}
                      label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    >
                      {spendingData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="text-center bg-white/80 px-3 py-1 rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-purple-900">{formatCurrency(5780)}</div>
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
                  <BarChart 
                    data={cashFlowData}
                    margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                  >
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#6B7280' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={formatCurrency}
                      tick={{ fill: '#6B7280' }}
                      tickLine={false}
                      domain={[-400, 400]}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        padding: '0.5rem',
                      }}
                    />
                    <Bar 
                      dataKey="amount"
                    >
                      {cashFlowData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={entry.amount >= 0 ? '#34D399' : '#F87171'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div 
            className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left transition-all duration-500 ease-out delay-500 transform ${
              isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
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
      <Footer />
    </div>
  );
};

export default Landing;