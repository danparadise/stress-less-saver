import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import PaystubTable from "../../paystubs/PaystubTable";
import PaystubEmpty from "../../paystubs/PaystubEmpty";
import PaystubLoading from "../../paystubs/PaystubLoading";
import { usePaystubData } from "./usePaystubData";
import { useRealtimeUpdates } from "./useRealtimeUpdates";

const PaystubData = () => {
  const { paystubs, isLoading, handleRefresh, deleteMutation } = usePaystubData();
  useRealtimeUpdates();

  const cardHeader = (
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

  if (isLoading) {
    return (
      <Card>
        {cardHeader}
        <CardContent>
          <PaystubLoading />
        </CardContent>
      </Card>
    );
  }

  if (!paystubs?.length) {
    return (
      <Card>
        {cardHeader}
        <CardContent>
          <PaystubEmpty />
        </CardContent>
      </Card>
    );
  }

  // Remove duplicates based on pay period dates and file name
  const uniquePaystubs = paystubs.reduce((acc, current) => {
    const key = `${current.pay_period_start}-${current.pay_period_end}-${current.financial_documents.file_name}`;
    const exists = acc.find(item => 
      `${item.pay_period_start}-${item.pay_period_end}-${item.financial_documents.file_name}` === key
    );
    
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, [] as typeof paystubs);

  return (
    <Card>
      {cardHeader}
      <CardContent>
        <PaystubTable 
          paystubs={uniquePaystubs} 
          onDelete={(paystubId, documentId) => deleteMutation.mutate({ paystubId, documentId })}
          isDeleting={deleteMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};

export default PaystubData;