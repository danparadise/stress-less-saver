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

  // Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("financial_docs")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Insert document record
  const { data: docData, error: dbError } = await supabase
    .from("financial_documents")
    .insert({
      document_type: documentType,
      file_path: filePath,
      file_name: file.name,
      month_year: format(date, "yyyy-MM-dd"),
      user_id: user.id
    })
    .select()
    .single();

  if (dbError) throw dbError;

  // If it's a paystub, trigger text extraction
  if (documentType === 'paystub') {
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from("financial_docs")
      .getPublicUrl(filePath);

    // Call the extract-paystub-text function
    const { error: extractError } = await supabase.functions
      .invoke('extract-paystub-text', {
        body: {
          documentId: docData.id,
          imageUrl: publicUrl
        }
      });

    if (extractError) {
      console.error('Error extracting text:', extractError);
      // Don't throw the error - we still want to complete the upload
    }
  }

  return { filePath, fileName };
};