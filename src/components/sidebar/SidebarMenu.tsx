import { Grid, BarChart2, FileText, Upload, CreditCard } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu as Menu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { title: "Dashboard", icon: Grid, path: "/dashboard" },
  { title: "Analytics", icon: BarChart2, path: "/analytics" },
  { title: "Bank Statements", icon: FileText, path: "/bank-statements" },
  { title: "Pay Stubs", icon: FileText, path: "/paystubs" },
  { title: "Manage Plan", icon: CreditCard, path: "/plans" },
];

const SidebarMenu = () => {
  const navigate = useNavigate();

  return (
    <SidebarGroup>
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
          
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className="w-full flex items-center gap-3 px-6 py-2.5 text-base font-medium hover:bg-purple-500/10 transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  <span>Upload Document</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/paystubs')} className="py-2">
                  Upload Paystub
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/bank-statements')} className="py-2">
                  Upload Bank Statement
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </Menu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default SidebarMenu;