import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Settings, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const UserProfile = () => {
  const navigate = useNavigate();
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      return profile;
    },
  });

  useEffect(() => {
    const checkFirstLogin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (!profile?.username) {
        setShowNamePrompt(true);
        navigate("/profile");
        toast.info("Please set your display name");
      }
    };

    checkFirstLogin();
  }, [navigate]);

  return (
    <div className="p-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full flex items-center gap-3 p-3 rounded-full bg-white/90 dark:bg-purple-900/20 border border-purple-500/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all"
          >
            <Avatar className="h-9 w-9 border-2 border-purple-500/20">
              <AvatarFallback className="bg-purple-900/40 text-purple-100">
                {profile?.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-base font-medium text-purple-900 dark:text-purple-100">
                {profile?.username || "User"}
              </span>
              <span className="text-sm text-purple-600/90 dark:text-purple-300/80">
                {profile?.subscription_status === "pro" ? "Pro Plan" : "Free Plan"}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserProfile;