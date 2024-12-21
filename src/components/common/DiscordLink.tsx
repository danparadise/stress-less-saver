import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiscordLinkProps {
  variant?: "default" | "ghost" | "link";
  className?: string;
}

const DiscordLink = ({ variant = "default", className = "" }: DiscordLinkProps) => {
  return (
    <Button
      variant={variant}
      className={`flex items-center gap-2 ${className}`}
      onClick={() => window.open("https://discord.gg/UwQJuxQj", "_blank")}
    >
      <MessageCircle className="h-5 w-5" />
      <span>Join our Discord</span>
    </Button>
  );
};

export default DiscordLink;