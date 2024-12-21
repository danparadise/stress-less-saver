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

const AppSidebar = () => {
  return (
    <Sidebar variant="inset" className="sidebar-gradient">
      <SidebarContent>
        <UserProfile />
        <SidebarNavigation />
        <SidebarMenu>
          <DocumentUploadButton />
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