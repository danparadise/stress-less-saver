import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import HeroSection from "@/components/landing/HeroSection";
import AnalyticsPreview from "@/components/landing/AnalyticsPreview";
import FeaturesSection from "@/components/landing/FeaturesSection";

const Landing = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const originalTheme = root.classList.contains('dark') ? 'dark' : 'light';
    root.classList.remove('dark');
    
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white overflow-hidden">
      <div className="container mx-auto px-4 py-16">
        <HeroSection />
        <AnalyticsPreview />
        <FeaturesSection />
      </div>
      <Footer />
    </div>
  );
};

export default Landing;