import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface PaystubDataHeaderProps {
  onRefresh: () => Promise<void>;
}

const PaystubDataHeader = ({ onRefresh }: PaystubDataHeaderProps) => {
  const handleRefresh = async () => {
    try {
      await onRefresh();
      toast("Data refreshed successfully");
    } catch (error) {
      toast("Failed to refresh data", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle>Extracted Paystub Data</CardTitle>
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Refresh
      </Button>
    </CardHeader>
  );
};

export default PaystubDataHeader;