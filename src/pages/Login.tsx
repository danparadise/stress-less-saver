import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { LoginHeader } from "@/components/auth/LoginHeader";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { AuthEventHandler } from "@/components/auth/AuthEventHandler";

const Login = () => {
  const checkSubscription = async (token: string, email: string) => {
    // Special handling for admin email
    if (email === 'dannielparadise@gmail.com') {
      return true;
    }

    try {
      const response = await fetch('https://dfwiszjyvkfmpejsqvbf.supabase.co/functions/v1/check-subscription', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check subscription status');
      }

      const data = await response.json();
      return data.subscribed;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md space-y-8">
        <LoginHeader />
        <div className="bg-white shadow-xl rounded-2xl p-8 border border-purple-100">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#7c3aed',
                    brandAccent: '#6d28d9',
                    brandButtonText: 'white',
                    defaultButtonBackground: 'white',
                    defaultButtonBackgroundHover: '#f5f3ff',
                    defaultButtonBorder: '#e9d5ff',
                    defaultButtonText: '#6d28d9',
                    dividerBackground: '#f3f4f6',
                    inputBackground: 'white',
                    inputBorder: '#e9d5ff',
                    inputBorderHover: '#7c3aed',
                    inputBorderFocus: '#7c3aed',
                    inputText: '#1f2937',
                    inputLabelText: '#4b5563',
                    inputPlaceholder: '#9ca3af',
                    messageText: '#dc2626',
                    anchorTextColor: '#7c3aed',
                    anchorTextHoverColor: '#6d28d9',
                  },
                },
              },
              className: {
                anchor: 'text-purple-600 hover:text-purple-700 font-medium',
                message: 'text-red-600 text-sm mt-1',
              },
            }}
            theme="default"
            providers={[]}
            localization={{
              variables: {
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Password',
                  email_input_placeholder: 'Your email address',
                  password_input_placeholder: 'Create a strong password (min. 8 chars)',
                  button_label: 'Sign up',
                  loading_button_label: 'Signing up...',
                  social_provider_text: 'Sign up with {{provider}}',
                  link_text: "Don't have an account? Sign up",
                  confirmation_text: 'Please ensure your password meets the requirements below.',
                },
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Password',
                  email_input_placeholder: 'Your email address',
                  password_input_placeholder: 'Your password',
                  button_label: 'Sign in',
                  loading_button_label: 'Signing in...',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: 'Already have an account? Sign in',
                },
                forgotten_password: {
                  email_label: 'Email',
                  password_label: 'Password',
                  email_input_placeholder: 'Your email address',
                  button_label: 'Send reset instructions',
                  loading_button_label: 'Sending reset instructions...',
                  link_text: 'Forgot your password?',
                },
              },
            }}
            redirectTo={window.location.origin}
            showLinks={true}
            view="sign_up"
          />
        </div>
        <PasswordRequirements />
      </div>
      <AuthEventHandler checkSubscription={checkSubscription} />
    </div>
  );
};

export default Login;