import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Button asChild variant="outline" className="mb-8">
          <Link to="/">← Back to Home</Link>
        </Button>
        
        <h1 className="text-4xl font-bold text-purple-900 mb-8">Protecting Your Privacy</h1>
        
        <div className="prose prose-purple max-w-none">
          <p className="text-lg text-purple-800 mb-6">
            At PayGuard AI, your privacy is our top priority. We adhere to California Consumer Privacy Act (CCPA) 
            regulations to ensure your personal data is protected. Here's how we manage your data:
          </p>
          
          <h2 className="text-2xl font-semibold text-purple-900 mt-8 mb-4">Data Collection</h2>
          <p>
            We collect only the necessary information from your uploaded documents (e.g., bank statements and 
            paystubs) to provide financial insights.
          </p>
          
          <h2 className="text-2xl font-semibold text-purple-900 mt-8 mb-4">Data Usage</h2>
          <p>
            Your data is processed securely through OpenAI's platform to generate personalized financial advice. 
            We do not share your data with third parties without your consent.
          </p>
          
          <h2 className="text-2xl font-semibold text-purple-900 mt-8 mb-4">Your Rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access and Deletion:</strong> Request access to or deletion of your data anytime.</li>
            <li><strong>Opt-Out:</strong> Opt out of data processing for analytics purposes.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-purple-900 mt-8 mb-4">Storage</h2>
          <p>
            Uploaded documents are encrypted and stored securely within our database for up to 90 days, after 
            which they are permanently deleted unless retained at your request.
          </p>
          
          <p className="mt-8">
            For further details, contact{" "}
            <a href="mailto:support@payguard.ai" className="text-purple-600 hover:text-purple-800">
              support@payguard.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;