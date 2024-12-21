import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Button asChild variant="outline" className="mb-8">
          <Link to="/">← Back to Home</Link>
        </Button>
        
        <h1 className="text-4xl font-bold text-purple-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-purple max-w-none">
          <p className="text-lg text-purple-800 mb-6">
            Welcome to PayGuard AI! By using our platform, you agree to the following terms:
          </p>
          
          <h2 className="text-2xl font-semibold text-purple-900 mt-8 mb-4">Eligibility</h2>
          <p>Users must be 18 years or older.</p>
          
          <h2 className="text-2xl font-semibold text-purple-900 mt-8 mb-4">Data Responsibility</h2>
          <p>Uploaded documents must be your own and comply with applicable laws.</p>
          
          <h2 className="text-2xl font-semibold text-purple-900 mt-8 mb-4">Service Limitation</h2>
          <p>PayGuard AI provides financial analysis and insights but does not guarantee specific financial outcomes.</p>
          
          <h2 className="text-2xl font-semibold text-purple-900 mt-8 mb-4">User Conduct</h2>
          <p>You agree not to misuse our platform for fraudulent or unlawful activities.</p>
          
          <h2 className="text-2xl font-semibold text-purple-900 mt-8 mb-4">Termination</h2>
          <p>Accounts may be suspended for violation of these terms.</p>
          
          <p className="mt-8">
            By using PayGuard AI, you acknowledge that you've read and understood these terms. Questions? Email us at{" "}
            <a href="mailto:support@payguard.ai" className="text-purple-600 hover:text-purple-800">
              support@payguard.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;