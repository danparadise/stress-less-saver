import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-purple-800 dark:text-white">
            Welcome to PayGuard AI
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your account
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#7c3aed',
                    brandAccent: '#6d28d9',
                  },
                },
              },
            }}
            theme="default"
            providers={[]}
            localization={{
              variables: {
                sign_up: {
                  password_label: 'Password (minimum 6 characters)',
                  password_input_placeholder: 'Enter a secure password',
                },
              },
            }}
            onError={(error) => {
              toast.error(error.message);
            }}
          />
        </div>
        <div className="text-center text-sm text-muted-foreground">
          <p>Password requirements:</p>
          <ul className="list-disc list-inside mt-1">
            <li>Minimum 6 characters</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;