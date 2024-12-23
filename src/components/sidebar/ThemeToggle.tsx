import { Moon, Sun } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useTheme } from "@/components/ThemeProvider";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="w-full flex items-center gap-3 px-6 py-2.5 text-base font-medium hover:bg-purple-500/10 transition-colors"
      >
        {theme === "dark" ? (
          <>
            <Sun className="h-5 w-5" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="h-5 w-5" />
            <span>Dark Mode</span>
          </>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

export default ThemeToggle;