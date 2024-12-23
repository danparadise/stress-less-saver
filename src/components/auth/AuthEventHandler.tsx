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
      console.log('Auth event:', event);
      console.log('Session:', session);

      if (event === 'SIGNED_IN' && session) {
        try {
          console.log('User signed in:', session.user.email);
          
          // Special handling for specific users
          const specialUsers = ['dannielparadise@gmail.com', 'sandraperez09@aol.com'];
          if (specialUsers.includes(session.user.email || '')) {
            console.log('Special user detected:', session.user.email);
            toast.success('Welcome back!');
            navigate("/dashboard");
            return;
          }

          // Check subscription status with Stripe
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
              return;
            }
            
            toast.success('Welcome back!');
            navigate("/dashboard");
          } else {
            // Check if user has founder code
            const { data: profile } = await supabase
              .from('profiles')
              .select('founder_code')
              .eq('id', session.user.id)
              .single();

            if (profile?.founder_code === 'FOUNDER') {
              toast.success('Welcome back, Founder!');
              navigate("/dashboard");
              return;
            }

            // User needs to complete subscription
            try {
              const response = await supabase.functions.invoke('create-checkout');
              
              if (!response.data?.url) {
                throw new Error('No checkout URL received');
              }

              window.location.href = response.data.url;
            } catch (error) {
              console.error('Error creating checkout session:', error);
              toast.error('Failed to process subscription. Please try again.');
            }
          }
        } catch (error) {
          console.error('Error in auth flow:', error);
          toast.error('Error during sign in. Please try again.');
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