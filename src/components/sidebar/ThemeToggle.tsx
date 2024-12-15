import { Moon, Sun } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useTheme } from "@/components/ThemeProvider";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
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
  );
};

export default ThemeToggle;