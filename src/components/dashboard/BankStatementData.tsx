import { Card, CardContent } from "@/components/ui/card";
import BankStatementTable from "../bankstatements/BankStatementTable";
import BankStatementEmpty from "../bankstatements/BankStatementEmpty";
import BankStatementLoading from "../bankstatements/BankStatementLoading";
import BankStatementHeader from "../bankstatements/BankStatementHeader";
import { useBankStatements } from "../bankstatements/useBankStatements";
import { useDeleteBankStatement } from "../bankstatements/useDeleteBankStatement";

const BankStatementData = () => {
  const { statements, isLoading, refetch } = useBankStatements();
  const deleteMutation = useDeleteBankStatement();

  if (isLoading) {
    return (
      <Card>
        <BankStatementHeader onRefresh={refetch} />
        <CardContent>
          <BankStatementLoading />
        </CardContent>
      </Card>
    );
  }

  if (!statements?.length) {
    return (
      <Card>
        <BankStatementHeader onRefresh={refetch} />
        <CardContent>
          <BankStatementEmpty />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <BankStatementHeader onRefresh={refetch} />
      <CardContent>
        <BankStatementTable 
          statements={statements} 
          onDelete={(statementId, documentId) => deleteMutation.mutate({ statementId, documentId })}
          isDeleting={deleteMutation.isPending}
        />
      </CardContent>
    </Card>
  );
};

export default BankStatementData;