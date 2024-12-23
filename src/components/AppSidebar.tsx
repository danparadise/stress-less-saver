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
import { useNavigate } from "react-router-dom";

const AppSidebar = () => {
  const { data: profile } = useSubscriptionStatus();
  const navigate = useNavigate();

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
              onClick={() => navigate('/plans')}
            >
              <CreditCard className="h-5 w-5 mr-3" />
              <span>Manage Plan</span>
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