import { Card, CardContent } from "@/components/ui/card";

const PaystubEmpty = () => {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">
        No paystub data available. Try uploading a paystub document.
      </p>
    </div>
  );
};

export default PaystubEmpty;