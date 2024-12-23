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

  return (
    <Sidebar variant="inset" className="sidebar-gradient">
      <SidebarContent>
        <UserProfile />
        <SidebarNavigation />
        <SidebarMenu>
          <DocumentUploadButton />
          {profile?.subscription_status === 'pro' && (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleManageSubscription}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <SidebarMenu>
          <DiscordLink variant="ghost" className="w-full justify-start" />
          <ThemeToggle />
          <LogoutButton />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;