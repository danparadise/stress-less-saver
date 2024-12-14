import { Settings, BarChart2, Activity, Grid, Database, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Overview", icon: Activity },
  { title: "Analytics", icon: BarChart2 },
  { title: "Dashboard", icon: Grid },
  { title: "Database", icon: Database },
  { title: "Settings", icon: Settings },
];

const AppSidebar = () => {
  return (
    <Sidebar variant="inset" className="border-r border-border/40">
      <SidebarContent>
        <div className="p-6">
          <img
            src="/lovable-uploads/c6bfa104-b34d-4f58-88e1-a76291298892.png"
            alt="Logo"
            className="h-8 w-auto mb-8"
          />
          <div className="mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-sage-100 flex items-center justify-center">
                <span className="text-sage-700 font-medium">JD</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">John Doe</span>
                <span className="text-xs text-muted-foreground">Pro Member</span>
              </div>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-red-500 hover:text-red-600">
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;