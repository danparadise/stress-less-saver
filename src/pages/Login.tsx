import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();

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

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if user has an active subscription or is admin
        const isSubscribed = await checkSubscription(session.access_token, session.user.email || '');
        
        if (isSubscribed) {
          toast.success('Welcome back!');
          navigate("/dashboard");
        } else {
          toast.info('Please complete your subscription to continue');
          // Create checkout session and redirect to payment
          try {
            const response = await fetch('https://dfwiszjyvkfmpejsqvbf.supabase.co/functions/v1/create-checkout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              throw new Error('Failed to create checkout session');
            }

            const { url } = await response.json();
            if (url) {
              window.location.href = url;
            }
          } catch (error) {
            console.error('Error creating checkout session:', error);
            toast.error('Failed to process subscription. Please try again.');
          }
        }
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-purple-900">
            Welcome to PayGuard AI
          </h2>
          <p className="mt-2 text-base text-purple-600">
            Sign in to access your account
          </p>
        </div>
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
                  },
                  space: {
                    inputPadding: '1rem',
                    buttonPadding: '1rem',
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '0.5rem',
                    buttonBorderRadius: '0.5rem',
                    inputBorderRadius: '0.5rem',
                  },
                  fontSizes: {
                    baseInputSize: '1rem',
                    baseButtonSize: '1rem',
                  },
                },
              },
              style: {
                button: {
                  fontSize: '1rem',
                  padding: '0.75rem 1rem',
                  fontWeight: '500',
                },
                input: {
                  fontSize: '1rem',
                },
                label: {
                  fontSize: '0.875rem',
                  color: '#4b5563',
                  fontWeight: '500',
                },
                anchor: {
                  color: '#7c3aed',
                  fontWeight: '500',
                  textDecoration: 'none',
                },
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
                  password_input_placeholder: 'Your password',
                  button_label: 'Sign up',
                  loading_button_label: 'Signing up...',
                  social_provider_text: 'Sign up with {{provider}}',
                  link_text: "Don't have an account? Sign up",
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
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;