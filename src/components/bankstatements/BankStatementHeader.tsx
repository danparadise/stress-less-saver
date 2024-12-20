import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface BankStatementHeaderProps {
  onRefresh: () => Promise<void>;
}

const BankStatementHeader = ({ onRefresh }: BankStatementHeaderProps) => {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = async () => {
    setIsSpinning(true);
    try {
      await onRefresh();
      toast("Refreshing page...");
      // Short delay to show the spinning animation and toast
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast("Failed to refresh data", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      setIsSpinning(false);
    }
  };

  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Bank Statement Data</CardTitle>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        className="gap-2 transition-transform"
        disabled={isSpinning}
      >
        <RefreshCw className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`} />
        {isSpinning ? 'Refreshing...' : 'Refresh'}
      </Button>
    </CardHeader>
  );
};

export default BankStatementHeader;