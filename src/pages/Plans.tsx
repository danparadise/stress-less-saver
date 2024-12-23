import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

const Plans = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { data: profile } = useSubscriptionStatus();
  const isPro = profile?.subscription_status === 'pro';

  const handleUpgradeSubscription = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to upgrade your subscription");
        return;
      }

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
      console.error('Error:', error);
      toast.error("Failed to start subscription process");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to manage your subscription");
        return;
      }

      const response = await fetch('https://dfwiszjyvkfmpejsqvbf.supabase.co/functions/v1/create-portal-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to open subscription management portal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Subscription Plans</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="relative">
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>Basic features for personal use</CardDescription>
            <div className="mt-4 text-3xl font-bold">$0/month</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Basic document analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Limited monthly uploads</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-500" />
                <span className="text-muted-foreground">Advanced AI insights</span>
              </li>
            </ul>
            {isPro && (
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  disabled={true}
                >
                  Current Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="relative border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle>Pro Plan</CardTitle>
            <CardDescription>Advanced features for power users</CardDescription>
            <div className="mt-4 text-3xl font-bold">$10/month</div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span>Everything in Free</span>
              </li>
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
            <div className="mt-6">
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                onClick={isPro ? handleManageSubscription : handleUpgradeSubscription}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Plans;