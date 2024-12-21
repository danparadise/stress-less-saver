import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const DataProcessing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Button asChild variant="outline" className="mb-8">
          <Link to="/">← Back to Home</Link>
        </Button>
        
        <h1 className="text-4xl font-bold text-purple-900 mb-8">How We Process Your Data</h1>
        
        <div className="prose prose-purple max-w-none">
          <p className="text-lg text-purple-800 mb-6">
            PayGuard AI processes your uploaded documents as follows:
          </p>
          
          <ul className="list-disc pl-6 space-y-4">
            <li>Documents are encrypted and securely uploaded.</li>
            <li>Data is extracted and analyzed by OpenAI to generate insights.</li>
            <li>Insights are displayed on your dashboard for review.</li>
          </ul>
          
          <p className="mt-8">
            We do not sell or share your data. After processing, documents are retained for up to 90 days before 
            deletion. Contact{" "}
            <a href="mailto:support@payguard.ai" className="text-purple-600 hover:text-purple-800">
              support@payguard.ai
            </a>
            {" "}for more information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataProcessing;