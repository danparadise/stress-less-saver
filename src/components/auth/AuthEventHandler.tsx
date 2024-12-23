import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AuthEventHandlerProps {
  checkSubscription: (token: string, email: string) => Promise<{
    subscribed: boolean;
    isTrialing: boolean;
  }>;
}

export const AuthEventHandler = ({ checkSubscription }: AuthEventHandlerProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          console.log('User signed in:', session.user.email);
          
          // First check profiles table as it's our source of truth
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('subscription_status, founder_code')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching profile:', profileError);
            toast.error('Error checking subscription status');
            navigate('/login');
            return;
          }

          console.log('Profile data:', profile);

          // Special handling for specific users
          const specialUsers = ['dannielparadise@gmail.com', 'sandraperez09@aol.com'];
          if (specialUsers.includes(session.user.email || '')) {
            console.log('Special user detected:', session.user.email);
            toast.success('Welcome back!');
            navigate("/dashboard");
            return;
          }

          // Check for pro status, trial, or founder code
          if (
            profile?.subscription_status === 'pro' || 
            profile?.subscription_status === 'trial' ||
            profile?.founder_code === 'FOUNDER'
          ) {
            console.log('User has valid subscription or founder status');
            toast.success('Welcome back!');
            navigate("/dashboard");
            return;
          }

          // If not marked as pro/trial/founder in profiles, verify with Stripe
          console.log('Verifying subscription with Stripe...');
          const { subscribed, isTrialing } = await checkSubscription(
            session.access_token, 
            session.user.email || ''
          );
          
          console.log('Stripe subscription check result:', { subscribed, isTrialing });
          
          if (subscribed || isTrialing) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                subscription_status: isTrialing ? 'trial' : 'pro' 
              })
              .eq('id', session.user.id);

            if (updateError) {
              console.error('Error updating profile:', updateError);
              toast.error('Error updating subscription status');
              navigate('/login');
              return;
            }
            
            toast.success('Welcome back!');
            navigate("/dashboard");
          } else {
            // User needs to complete subscription
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
              } else {
                throw new Error('No checkout URL received');
              }
            } catch (error) {
              console.error('Error creating checkout session:', error);
              toast.error('Failed to process subscription. Please try again.');
              navigate('/login');
            }
          }
        } catch (error) {
          console.error('Error in auth flow:', error);
          toast.error('Error during sign in. Please try again.');
          navigate('/login');
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