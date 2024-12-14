import { Moon, Sun } from "lucide-react";
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
    <div className="flex flex-col items-center mb-8 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0"
        onClick={handleToggleDarkMode}
      >
        {isDark ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>
      <div className="w-48 h-48 mb-4">
        <img
          src={isDark ? "/lovable-uploads/d6799270-a533-42b4-b766-bdd5482b3b0d.png" : "/lovable-uploads/c6bfa104-b34d-4f58-88e1-a76291298892.png"}
          alt="PayGuard Logo"
          className="w-full h-full object-contain"
        />
      </div>
      <p className="text-black dark:text-sage-300 mt-2 italic">A Wise Way To Get Paid</p>
    </div>
  );
};

export default Header;