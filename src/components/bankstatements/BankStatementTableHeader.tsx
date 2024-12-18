import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUp, ArrowDown } from "lucide-react";

interface BankStatementTableHeaderProps {
  sortOrder: "asc" | "desc";
  onSort: () => void;
}

const BankStatementTableHeader = ({ sortOrder, onSort }: BankStatementTableHeaderProps) => {
  return (
    <TableHeader>
      <TableRow className="bg-muted/50">
        <TableHead>Document</TableHead>
        <TableHead>Upload Date</TableHead>
        <TableHead>Status</TableHead>
        <TableHead 
          onClick={onSort}
          className="cursor-pointer hover:bg-muted/70 transition-colors flex items-center gap-2"
        >
          Statement Month
          {sortOrder === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </TableHead>
        <TableHead className="text-right">Total Deposits</TableHead>
        <TableHead className="text-right">Total Withdrawals</TableHead>
        <TableHead className="text-right">Ending Balance</TableHead>
        <TableHead>Transactions</TableHead>
        <TableHead className="w-[150px]">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default BankStatementTableHeader;