import { Grid, BarChart2, FileText, ClipboardCheck } from "lucide-react";
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
  { title: "Analytics", icon: BarChart2, path: "/analytics" },
  { title: "Financial Audit", icon: ClipboardCheck, path: "/audit" },
  { title: "Paystubs", icon: FileText, path: "/paystubs" },
  { title: "Bank Statements", icon: FileText, path: "/bank-statements" },
];

const SidebarMenu = () => {
  const navigate = useNavigate();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-4 text-base font-medium">Menu</SidebarGroupLabel>
      <SidebarGroupContent>
        <Menu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-base hover:bg-purple-500/10 transition-colors"
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