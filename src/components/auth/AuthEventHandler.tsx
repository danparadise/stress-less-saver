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
        try {
          // Check if user is subscribed
          const isSubscribed = await checkSubscription(session.access_token, session.user.email || '');
          
          if (isSubscribed) {
            toast.success('Welcome back!');
            navigate("/dashboard");
          } else {
            // Check profiles table for subscription status as backup
            const { data: profile } = await supabase
              .from('profiles')
              .select('subscription_status')
              .eq('id', session.user.id)
              .single();

            if (profile?.subscription_status === 'pro') {
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
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
          toast.error('Error checking subscription status. Please try again.');
        }
      } else if (event === 'SIGNED_OUT') {
        navigate('/login');
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