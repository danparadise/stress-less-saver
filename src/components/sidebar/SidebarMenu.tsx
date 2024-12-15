import { Grid, Activity, BarChart2, FileText, Database, Settings } from "lucide-react";
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
  { title: "Dashboard", icon: Grid, path: "/" },
  { title: "Overview", icon: Activity, path: "/" },
  { title: "Analytics", icon: BarChart2, path: "/" },
  { title: "Paystubs", icon: FileText, path: "/paystubs" },
  { title: "Bank Statements", icon: FileText, path: "/bank-statements" },
  { title: "Database", icon: Database, path: "/" },
  { title: "Settings", icon: Settings, path: "/" },
];

const SidebarMenu = () => {
  const navigate = useNavigate();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarGroupContent>
        <Menu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton onClick={() => navigate(item.path)}>
                <item.icon className="h-4 w-4" />
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