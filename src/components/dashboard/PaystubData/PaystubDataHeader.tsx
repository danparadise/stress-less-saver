import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface PaystubDataHeaderProps {
  onRefresh: () => void;
}

const PaystubDataHeader = ({ onRefresh }: PaystubDataHeaderProps) => (
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle>Extracted Paystub Data</CardTitle>
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      className="gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Refresh
    </Button>
  </CardHeader>
);

export default PaystubDataHeader;