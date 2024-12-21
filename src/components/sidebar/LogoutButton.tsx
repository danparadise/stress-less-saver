import { LogOut } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        onClick={handleLogout}
        className="text-red-500 hover:text-red-600"
      >
        <LogOut className="h-4 w-4" />
        <span>Log out</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export default LogoutButton;