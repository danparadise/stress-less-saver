import { FileText } from "lucide-react";

const BankStatementEmpty = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Bank Statements</h3>
      <p className="text-muted-foreground max-w-sm">
        Upload your first bank statement to start tracking your financial activity.
      </p>
    </div>
  );
};

export default BankStatementEmpty;