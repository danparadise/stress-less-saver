import { Upload } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

const DocumentUploadButton = () => {
  const navigate = useNavigate();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-base hover:bg-purple-500/10 transition-colors"
        >
          <Upload className="h-5 w-5" />
          <span>Upload Document</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default DocumentUploadButton;