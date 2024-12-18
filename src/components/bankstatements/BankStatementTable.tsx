import { Table, TableBody } from "@/components/ui/table";
import { useState } from "react";
import BankStatementTableHeader from "./BankStatementTableHeader";
import BankStatementTableRow from "./BankStatementTableRow";

interface BankStatementTableProps {
  statements: any[];
  onDelete: (statementId: string, documentId: string) => void;
  isDeleting: boolean;
}

const BankStatementTable = ({ statements, onDelete, isDeleting }: BankStatementTableProps) => {
  // Filter out statements with no transactions before setting initial state
  const validStatements = statements.filter(statement => 
    Array.isArray(statement.transactions) && statement.transactions.length > 0
  );
  
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortedData, setSortedData] = useState(validStatements);

  const handleSortByDate = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    
    const sorted = [...sortedData].sort((a, b) => {
      if (!a.statement_month || !b.statement_month) return 0;
      
      const dateA = new Date(a.statement_month).getTime();
      const dateB = new Date(b.statement_month).getTime();
      
      return newOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    setSortedData(sorted);
    setSortOrder(newOrder);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <BankStatementTableHeader 
          sortOrder={sortOrder}
          onSort={handleSortByDate}
        />
        <TableBody>
          {sortedData.map((statement) => (
            <BankStatementTableRow
              key={statement.id}
              statement={statement}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BankStatementTable;