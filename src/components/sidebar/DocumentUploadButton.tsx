import { Upload } from "lucide-react";
import {
  SidebarMenu,
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

const DocumentUploadButton = () => {
  const navigate = useNavigate();

  const handleUpload = (type: 'paystubs' | 'bank-statements') => {
    navigate(`/${type}`);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="w-full flex items-center gap-3 px-4 py-2.5 text-base font-medium hover:bg-purple-500/10 transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span>Upload Document</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => handleUpload('paystubs')} className="py-2">
              Upload Paystub
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpload('bank-statements')} className="py-2">
              Upload Bank Statement
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default DocumentUploadButton;