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

  const fileExt = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${documentType}/${fileName}`;

  console.log('Starting file upload to storage:', filePath);

  // Upload file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("financial_docs")
    .upload(filePath, file);

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw uploadError;
  }

  console.log('File uploaded successfully, creating document record');

  // Insert document record
  const { data: docData, error: dbError } = await supabase
    .from("financial_documents")
    .insert({
      document_type: documentType,
      file_path: filePath,
      file_name: file.name,
      month_year: format(date, "yyyy-MM-dd"),
      user_id: user.id,
      status: status
    })
    .select()
    .single();

  if (dbError) {
    console.error('Database insert error:', dbError);
    throw dbError;
  }

  console.log('Document record created:', docData.id);

  // If it's a PDF, trigger conversion and data extraction based on document type
  if (file.type === "application/pdf") {
    console.log('PDF detected, initiating conversion and extraction');
    
    const { data: { publicUrl } } = supabase.storage
      .from("financial_docs")
      .getPublicUrl(filePath);

    try {
      // Call the appropriate edge function based on document type
      const functionName = documentType === 'paystub' ? 'extract-paystub-text' : 'extract-bank-statement';
      console.log(`Calling ${functionName} function with:`, {
        documentId: docData.id,
        pdfUrl: publicUrl
      });

      const { data, error: extractError } = await supabase.functions
        .invoke(functionName, {
          body: {
            documentId: docData.id,
            pdfUrl: publicUrl
          }
        });

      if (extractError) {
        console.error('Error extracting data:', extractError);
        await supabase
          .from("financial_documents")
          .update({ status: 'failed' })
          .eq('id', docData.id);
        throw extractError;
      }

      console.log('Data extraction response:', data);
    } catch (error) {
      console.error(`Failed to invoke ${documentType === 'paystub' ? 'extract-paystub-text' : 'extract-bank-statement'} function:`, error);
      await supabase
        .from("financial_documents")
        .update({ status: 'failed' })
        .eq('id', docData.id);
      throw new Error(`Failed to process ${documentType}: ${error.message}`);
    }
  }

  return { filePath, fileName, documentId: docData.id };
};