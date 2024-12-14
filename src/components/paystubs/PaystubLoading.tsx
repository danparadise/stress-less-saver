import { Card, CardContent } from "@/components/ui/card";

const PaystubLoading = () => {
  return (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default PaystubLoading;