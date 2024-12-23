import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AuthEventHandlerProps {
  checkSubscription: (token: string, email: string) => Promise<boolean>;
}

export const AuthEventHandler = ({ checkSubscription }: AuthEventHandlerProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const isSubscribed = await checkSubscription(session.access_token, session.user.email || '');
        
        if (isSubscribed) {
          toast.success('Welcome back!');
          navigate("/dashboard");
        } else {
          toast.info('Please complete your subscription to continue');
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
      } else if (event === 'SIGNED_OUT') {
        navigate('/login');
      } else if (event === 'SIGNED_UP') {
        // Handle the case where a user tries to sign up with an existing email
        const error = session?.error;
        if (error?.message?.includes('User already registered')) {
          toast.error(
            <div className="space-y-2">
              <p>This email is already registered.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Sign in
                </button>
                <span>or</span>
                <button
                  onClick={() => {
                    const email = (document.querySelector('input[type="email"]') as HTMLInputElement)?.value;
                    if (email) {
                      supabase.auth.resetPasswordForEmail(email);
                      toast.info('Password reset instructions sent to your email');
                    }
                  }}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Reset password
                </button>
              </div>
            </div>
          );
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        toast.info('Please check your email to reset your password');
      }
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, [navigate, checkSubscription]);

  return null;
};