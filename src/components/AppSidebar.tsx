import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
} from "@/components/ui/sidebar";
import UserProfile from "./sidebar/UserProfile";
import SidebarNavigation from "./sidebar/SidebarMenu";
import ThemeToggle from "./sidebar/ThemeToggle";
import LogoutButton from "./sidebar/LogoutButton";
import DiscordLink from "./common/DiscordLink";

const AppSidebar = () => {
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
        </div>

        <SidebarFooter className="p-4 space-y-2">
          <SidebarMenu>
            <ThemeToggle />
            <DiscordLink 
              variant="ghost" 
              className="w-full justify-start px-6 py-2.5 text-base font-medium hover:bg-purple-500/10 transition-colors" 
            />
            <LogoutButton />
          </SidebarMenu>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;