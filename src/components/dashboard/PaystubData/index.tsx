import { Card, CardContent } from "@/components/ui/card";
import PaystubTable from "../../paystubs/PaystubTable";
import PaystubEmpty from "../../paystubs/PaystubEmpty";
import PaystubLoading from "../../paystubs/PaystubLoading";
import { usePaystubData } from "./usePaystubData";
import { usePaystubSubscription } from "./usePaystubSubscription";
import PaystubDataHeader from "./PaystubDataHeader";

const PaystubData = () => {
  const { paystubs, isLoading, handleRefresh, deleteMutation } = usePaystubData();
  usePaystubSubscription();

  if (isLoading) {
    return (
      <Card>
        <PaystubDataHeader onRefresh={handleRefresh} />
        <CardContent>
          <PaystubLoading />
        </CardContent>
      </Card>
    );
  }

  if (!paystubs?.length) {
    return (
      <Card>
        <PaystubDataHeader onRefresh={handleRefresh} />
        <CardContent>
          <PaystubEmpty />
        </CardContent>
      </Card>
    );
  }

  // Remove duplicates based on pay period dates and file name, with null check
  const uniquePaystubs = paystubs.reduce((acc, current) => {
    if (!current.financial_documents) return acc;
    
    const key = `${current.pay_period_start}-${current.pay_period_end}-${current.financial_documents.file_name}`;
    const exists = acc.find(item => 
      item.financial_documents && 
      `${item.pay_period_start}-${item.pay_period_end}-${item.financial_documents.file_name}` === key
    );
    
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, [] as typeof paystubs);

  return (
    <Card>
      <PaystubDataHeader onRefresh={handleRefresh} />
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