import { Button } from "@/components/ui/button";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <div className="max-w-6xl mx-auto text-center space-y-8">
      <h1 className="text-5xl md:text-6xl font-bold text-purple-900 mb-6 transition-all duration-500 ease-out transform translate-y-0 opacity-100">
        PayGuard AI
      </h1>
      <p className="text-2xl md:text-3xl text-purple-800 mb-8 transition-all duration-500 ease-out delay-100 transform translate-y-0 opacity-100">
        A Simple Way To Check Your Finances
      </p>
      <p className="text-lg md:text-xl text-purple-700 mb-12 transition-all duration-500 ease-out delay-200 transform translate-y-0 opacity-100">
        Empower your financial decisions with AI-driven insights. Track expenses, analyze patterns, and secure your financial future.
      </p>
      
      <div className="flex justify-center gap-4 transition-all duration-500 ease-out delay-300 transform translate-y-0 opacity-100">
        <Button
          onClick={() => setShowOnboarding(true)}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
        >
          Get Started Free
        </Button>
        <Button
          onClick={() => navigate("/login")}
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
    </div>
  );
};

export default HeroSection;