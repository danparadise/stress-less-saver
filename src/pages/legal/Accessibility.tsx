import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Accessibility = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Button asChild variant="outline" className="mb-8">
          <Link to="/">← Back to Home</Link>
        </Button>
        
        <h1 className="text-4xl font-bold text-purple-900 mb-8">Accessibility Commitment</h1>
        
        <div className="prose prose-purple max-w-none">
          <p className="text-lg text-purple-800">
            At PayGuard AI, we strive to make our platform accessible to everyone. If you encounter difficulties 
            using our platform, please contact us at{" "}
            <a href="mailto:accessibility@payguard.ai" className="text-purple-600 hover:text-purple-800">
              accessibility@payguard.ai
            </a>
            {" "}or call (123) 456-7890. We are dedicated to improving accessibility and welcome your feedback.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Accessibility;