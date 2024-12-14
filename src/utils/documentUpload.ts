import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const uploadDocument = async (
  file: File,
  documentType: string,
  date: Date,
  status: 'pending' | 'pending_conversion' = 'pending'
) => {
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("User not authenticated");
  }

  console.log('Starting document upload process');

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${documentType}/${fileName}`;
  const monthYear = format(date, "yyyy-MM-dd");

  console.log('Uploading file to storage:', filePath);

  // Upload new file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("financial_docs")
    .upload(filePath, file);

  if (uploadError) {
    console.error('File upload failed:', uploadError);
    throw uploadError;
  }

  console.log('File uploaded successfully, creating document record');

  // Create document record
  const { data: docData, error: dbError } = await supabase
    .from("financial_documents")
    .insert({
      document_type: documentType,
      file_path: filePath,
      file_name: file.name,
      month_year: monthYear,
      user_id: user.id,
      status: status
    })
    .select()
    .single();

  if (dbError) {
    console.error('Failed to create document record:', dbError);
    throw dbError;
  }

  console.log('Document record created:', docData.id);

  // If it's a PDF, trigger conversion
  if (file.type === "application/pdf") {
    console.log('PDF detected, initiating conversion');
    
    const { data: { publicUrl } } = supabase.storage
      .from("financial_docs")
      .getPublicUrl(filePath);

    try {
      const { error: convertError } = await supabase.functions
        .invoke('convert-pdf', {
          body: {
            documentId: docData.id,
            pdfUrl: publicUrl
          }
        });

      if (convertError) {
        console.error('Error converting PDF:', convertError);
        throw convertError;
      }
    } catch (error) {
      console.error('Failed to invoke convert-pdf function:', error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }
  // If it's a paystub, trigger text extraction
  else if (documentType === 'paystub') {
    console.log('Paystub detected, initiating text extraction');
    
    const { data: { publicUrl } } = supabase.storage
      .from("financial_docs")
      .getPublicUrl(filePath);

    try {
      const { error: extractError } = await supabase.functions
        .invoke('extract-paystub-text', {
          body: {
            documentId: docData.id,
            imageUrl: publicUrl
          }
        });

      if (extractError) {
        console.error('Error extracting text:', extractError);
        throw extractError;
      }
    } catch (error) {
      console.error('Failed to invoke extract-paystub-text function:', error);
      throw new Error(`Failed to process paystub: ${error.message}`);
    }
  }

  return { filePath, fileName };
};