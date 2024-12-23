import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

const Plans = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useSubscriptionStatus();
  const isPro = profile?.subscription_status === 'pro';

  console.log('Subscription status:', profile?.subscription_status); // Debug log

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.functions.invoke('cancel-subscription');
      if (error) throw error;
      
      toast.success("Subscription cancelled successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to cancel subscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeSubscription = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to upgrade your subscription");
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {},
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL received');

      window.location.href = data.url;
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to start subscription process");
    } finally {
      setIsLoading(false);
    }
  };

  if (profileLoading) {
    return <div className="container mx-auto p-6">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="relative border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle>Pro Plan</CardTitle>
            <CardDescription>Advanced features for power users</CardDescription>
            <div className="mt-4 text-3xl font-bold">$15/month</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Unlimited document uploads</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Advanced AI insights</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Priority support</span>
              </li>
            </ul>
            {isPro ? (
              <Button 
                variant="destructive"
                className="w-full" 
                onClick={handleCancelSubscription}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </Button>
            ) : (
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                onClick={handleUpgradeSubscription}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Upgrade to Pro'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Plans;