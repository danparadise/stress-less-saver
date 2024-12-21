import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-purple-900 dark:to-purple-800">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-purple-900 dark:text-white mb-6 animate-fadeIn">
            PayGuard AI
          </h1>
          <p className="text-2xl md:text-3xl text-purple-800 dark:text-purple-100 mb-8 animate-fadeIn delay-100">
            A Simple Way To Check Your Finances
          </p>
          <p className="text-lg md:text-xl text-purple-700 dark:text-purple-200 mb-12 animate-fadeIn delay-200">
            Empower your financial decisions with AI-driven insights. Track expenses, analyze patterns, and secure your financial future.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeIn delay-300">
            <Button 
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
              onClick={() => navigate("/login")}
            >
              Get Started Free
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-purple-600 text-purple-600 hover:bg-purple-100 px-8 py-6 text-lg"
              onClick={() => navigate("/login")}
            >
              Watch Demo
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left animate-fadeIn delay-400">
            <div className="p-6 rounded-lg bg-white/80 dark:bg-purple-800/50 shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-purple-900 dark:text-white">AI-Powered Analysis</h3>
              <p className="text-purple-700 dark:text-purple-200">Smart insights and patterns detection to help you make better financial decisions.</p>
            </div>
            <div className="p-6 rounded-lg bg-white/80 dark:bg-purple-800/50 shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-purple-900 dark:text-white">Secure & Private</h3>
              <p className="text-purple-700 dark:text-purple-200">Bank-level security to keep your financial data safe and protected.</p>
            </div>
            <div className="p-6 rounded-lg bg-white/80 dark:bg-purple-800/50 shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-purple-900 dark:text-white">Easy Integration</h3>
              <p className="text-purple-700 dark:text-purple-200">Seamlessly connect your financial documents and start analyzing in minutes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;