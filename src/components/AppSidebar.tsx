import { Settings, BarChart2, Activity, Grid, Database, LogOut, Moon, Sun } from "lucide-react";
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
import { useTheme } from "@/components/ThemeProvider";

const menuItems = [
  { title: "Overview", icon: Activity },
  { title: "Analytics", icon: BarChart2 },
  { title: "Dashboard", icon: Grid },
  { title: "Database", icon: Database },
  { title: "Settings", icon: Settings },
];

const AppSidebar = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Sidebar variant="inset" className="sidebar-gradient">
      <SidebarContent>
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-sage-100 flex items-center justify-center">
                <span className="text-sage-700 font-medium">JD</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-purple-800 dark:text-white">John Doe</span>
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

      <SidebarFooter className="p-4 space-y-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-purple-800 dark:text-white hover:text-purple-600 dark:hover:text-purple-300"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
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