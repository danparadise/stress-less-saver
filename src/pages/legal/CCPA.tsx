import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CCPA = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Button asChild variant="outline" className="mb-8">
          <Link to="/">← Back to Home</Link>
        </Button>
        
        <h1 className="text-4xl font-bold text-purple-900 mb-8">California Consumer Privacy Act (CCPA) Notice</h1>
        
        <div className="prose prose-purple max-w-none">
          <p className="text-lg text-purple-800 mb-6">
            Under the CCPA, California residents have the following rights regarding their data:
          </p>
          
          <ul className="list-disc pl-6 space-y-4">
            <li><strong>Right to Know:</strong> Learn how your data is collected, used, and shared.</li>
            <li><strong>Right to Access:</strong> Request a copy of the data we've collected.</li>
            <li><strong>Right to Delete:</strong> Ask us to delete your data permanently.</li>
            <li><strong>Right to Opt-Out:</strong> Opt out of the sale or sharing of your data.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-purple-900 mt-8 mb-4">How to Exercise Your Rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Email privacy@payguard.ai with your request.</li>
            <li>Include your account details for verification.</li>
          </ul>
          
          <p className="mt-8">
            We are committed to maintaining transparency and protecting your privacy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CCPA;