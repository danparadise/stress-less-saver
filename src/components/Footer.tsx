import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white/80 border-t border-purple-100 py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-purple-900">PayGuard AI</h3>
            <p className="text-sm text-purple-700">
              A secure financial analysis platform helping you make better financial decisions.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-purple-900">Legal</h3>
            <ul className="space-y-2 text-sm text-purple-700">
              <li>
                <Link to="/privacy" className="hover:text-purple-900">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-purple-900">Terms of Service</Link>
              </li>
              <li>
                <Link to="/ccpa" className="hover:text-purple-900">CCPA Notice</Link>
              </li>
              <li>
                <Link to="/accessibility" className="hover:text-purple-900">Accessibility Statement</Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-purple-900">Security</h3>
            <ul className="space-y-2 text-sm text-purple-700">
              <li>
                <Link to="/security" className="hover:text-purple-900">Security Practices</Link>
              </li>
              <li>
                <Link to="/data-processing" className="hover:text-purple-900">Data Processing</Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-purple-900">Contact</h3>
            <ul className="space-y-2 text-sm text-purple-700">
              <li>
                <a href="mailto:support@payguard.ai" className="hover:text-purple-900">support@payguard.ai</a>
              </li>
              <li>
                123 Finance Street<br />
                San Francisco, CA 94105
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-purple-100 text-sm text-purple-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              © {currentYear} PayGuard AI. All rights reserved.
            </div>
            <div className="md:text-right">
              <p>
                California Residents: See our{" "}
                <Link to="/ccpa" className="underline hover:text-purple-900">
                  CCPA Notice
                </Link>
                {" "}for privacy rights.
              </p>
            </div>
          </div>
          
          <div className="mt-4 text-xs">
            This site is protected by reCAPTCHA and the Google{" "}
            <a href="https://policies.google.com/privacy" className="underline hover:text-purple-900" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            {" "}and{" "}
            <a href="https://policies.google.com/terms" className="underline hover:text-purple-900" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>
            {" "}apply.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;