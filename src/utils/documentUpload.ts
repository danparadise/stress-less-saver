import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const uploadDocument = async (
  file: File,
  documentType: string,
  date: Date
) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${documentType}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("financial_docs")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { error: dbError } = await supabase.from("financial_documents").insert({
    document_type: documentType,
    file_path: filePath,
    file_name: file.name,
    month_year: format(date, "yyyy-MM-dd"),
    user_id: user.id
  });

  if (dbError) throw dbError;

  return { filePath, fileName };
};