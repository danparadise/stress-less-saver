import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDeleteBankStatement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ statementId, documentId }: { statementId: string, documentId: string }) => {
      const { error } = await supabase
        .from("financial_documents")
        .delete()
        .eq("id", documentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bank statement deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["bank-statement-data"] });
    },
    onError: (error) => {
      console.error("Error deleting bank statement:", error);
      toast.error("Failed to delete bank statement");
    },
  });
};