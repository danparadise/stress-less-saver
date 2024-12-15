import { useRef, useState } from "react";
import BankStatementData from "@/components/dashboard/BankStatementData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2 } from "lucide-react";
import { uploadDocument } from "@/utils/documentUpload";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const BankStatements = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        // Extract month from filename or use current month
        const monthMatch = file.name.match(/(\d{4})[_-]?(\d{2})/);
        const statementDate = monthMatch 
          ? new Date(parseInt(monthMatch[1]), parseInt(monthMatch[2]) - 1)
          : new Date();

        const result = await uploadDocument(file, "bank_statement", statementDate);
        
        // Create initial bank statement record
        const { data: bankStatementData, error: bankStatementError } = await supabase
          .from('bank_statement_data')
          .insert({
            document_id: result.documentId,
            statement_month: format(statementDate, 'yyyy-MM-dd'),
            total_deposits: 0,
            total_withdrawals: 0,
            ending_balance: 0,
            transactions: []
          })
          .select()
          .single();

        if (bankStatementError) {
          throw bankStatementError;
        }

        toast.success("Bank statement uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Error uploading bank statement");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-purple-800 dark:text-white mb-2">
            Bank Statements
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            View and manage your bank statement documents
          </p>
        </div>
        <div>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Statement
              </>
            )}
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept="application/pdf"
            disabled={isUploading}
          />
        </div>
      </div>
      <BankStatementData />
    </div>
  );
};

export default BankStatements;