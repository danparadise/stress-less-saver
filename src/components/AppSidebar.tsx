import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
} from "@/components/ui/sidebar";
import UserProfile from "./sidebar/UserProfile";
import SidebarNavigation from "./sidebar/SidebarMenu";
import DocumentUploadButton from "./sidebar/DocumentUploadButton";
import ThemeToggle from "./sidebar/ThemeToggle";
import LogoutButton from "./sidebar/LogoutButton";
import DiscordLink from "./common/DiscordLink";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { Button } from "./ui/button";
import { CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AppSidebar = () => {
  const { data: profile } = useSubscriptionStatus();

  const handleManageSubscription = async () => {
    try {
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
    }
  };

  const handleUpgradeSubscription = async () => {
    try {
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
    }
  };

  return (
    <Sidebar variant="inset" className="sidebar-gradient">
      <SidebarContent className="flex flex-col h-full">
        <div className="flex-grow space-y-6">
          <div className="px-4 py-4">
            <UserProfile />
          </div>
          
          <div className="space-y-1">
            <SidebarNavigation />
          </div>

          <div className="px-2 space-y-1">
            <DocumentUploadButton />
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-2.5 text-base font-medium hover:bg-purple-500/10 transition-colors"
              onClick={profile?.subscription_status === 'pro' ? handleManageSubscription : handleUpgradeSubscription}
            >
              <CreditCard className="h-5 w-5 mr-3" />
              <span>{profile?.subscription_status === 'pro' ? 'Manage Subscription' : 'Upgrade to Pro'}</span>
            </Button>
          </div>
        </div>

        <SidebarFooter className="p-4 space-y-2">
          <SidebarMenu>
            <DiscordLink 
              variant="ghost" 
              className="w-full justify-start px-4 py-2.5 text-base font-medium hover:bg-purple-500/10 transition-colors" 
            />
            <ThemeToggle />
            <LogoutButton />
          </SidebarMenu>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;