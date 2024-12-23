import { Grid, BarChart2 } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu as Menu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", icon: Grid, path: "/dashboard" },
  { title: "Analytics", icon: BarChart2, path: "/analytics" },
];

const SidebarMenu = () => {
  const navigate = useNavigate();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-6 text-base font-semibold mb-2">Menu</SidebarGroupLabel>
      <SidebarGroupContent>
        <Menu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-6 py-2.5 text-base font-medium hover:bg-purple-500/10 transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </Menu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SidebarMenu;