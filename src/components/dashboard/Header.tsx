import { Moon, Sun, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  isDark: boolean;
  toggleDarkMode: () => void;
}

const Header = ({ isDark, toggleDarkMode }: HeaderProps) => {
  const { toast } = useToast();

  const handleToggleDarkMode = () => {
    toggleDarkMode();
    toast({
      title: isDark ? "Light mode activated" : "Dark mode activated",
      duration: 2000,
    });
  };

  return (
    <header className="w-full border-b border-border/40 bg-white/50 backdrop-blur-sm dark:bg-purple-900/10">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={isDark ? "/lovable-uploads/d6799270-a533-42b4-b766-bdd5482b3b0d.png" : "/lovable-uploads/c6bfa104-b34d-4f58-88e1-a76291298892.png"}
              alt="PayGuard Logo"
              className="h-8 w-auto"
            />
            <p className="text-black dark:text-sage-300 text-sm italic">
              A Wise Way To Get Paid
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-600 dark:text-neutral-300"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-600 dark:text-neutral-300"
            >
              <Bell className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleDarkMode}
              className="text-neutral-600 dark:text-neutral-300"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;