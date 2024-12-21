import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Security = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Button asChild variant="outline" className="mb-8">
          <Link to="/">← Back to Home</Link>
        </Button>
        
        <h1 className="text-4xl font-bold text-purple-900 mb-8">Security Practices</h1>
        
        <div className="prose prose-purple max-w-none">
          <p className="text-lg text-purple-800 mb-6">
            PayGuard AI uses advanced security measures to protect your data:
          </p>
          
          <ul className="list-disc pl-6 space-y-4">
            <li><strong>Encryption:</strong> All uploaded documents are encrypted during transit and storage.</li>
            <li><strong>Secure Access:</strong> Only authorized personnel can access your data.</li>
            <li><strong>Regular Audits:</strong> We perform routine security audits to identify and mitigate risks.</li>
          </ul>
          
          <p className="mt-8">
            Your data security is our responsibility, and we take this seriously. For questions, email us at{" "}
            <a href="mailto:support@payguard.ai" className="text-purple-600 hover:text-purple-800">
              support@payguard.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Security;