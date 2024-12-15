import { Loader2 } from "lucide-react";

const PaystubLoading = () => {
  return (
    <div className="flex items-center justify-center h-32">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default PaystubLoading;