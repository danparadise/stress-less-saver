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

  // If it's a PDF, trigger conversion
  if (file.type === "application/pdf") {
    console.log('PDF detected, initiating conversion');
    
    const { data: { publicUrl } } = supabase.storage
      .from("financial_docs")
      .getPublicUrl(filePath);

    try {
      console.log('Calling convert-pdf function with:', {
        documentId: docData.id,
        pdfUrl: publicUrl
      });

      const { data, error: convertError } = await supabase.functions
        .invoke('convert-pdf', {
          body: {
            documentId: docData.id,
            pdfUrl: publicUrl
          }
        });

      if (convertError) {
        console.error('Error converting PDF:', convertError);
        // Update document status to failed
        await supabase
          .from("financial_documents")
          .update({ status: 'failed' })
          .eq('id', docData.id);
        throw new Error(`Failed to convert PDF: ${convertError.message}`);
      }

      console.log('PDF conversion response:', data);
    } catch (error) {
      console.error('Failed to invoke convert-pdf function:', error);
      // Update document status to failed
      await supabase
        .from("financial_documents")
        .update({ status: 'failed' })
        .eq('id', docData.id);
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
      console.log('Calling extract-paystub-text function with:', {
        documentId: docData.id,
        imageUrl: publicUrl
      });

      const { data, error: extractError } = await supabase.functions
        .invoke('extract-paystub-text', {
          body: {
            documentId: docData.id,
            imageUrl: publicUrl
          }
        });

      if (extractError) {
        console.error('Error extracting text:', extractError);
        // Update document status to failed
        await supabase
          .from("financial_documents")
          .update({ status: 'failed' })
          .eq('id', docData.id);
        throw extractError;
      }

      console.log('Text extraction response:', data);
    } catch (error) {
      console.error('Failed to invoke extract-paystub-text function:', error);
      // Update document status to failed
      await supabase
        .from("financial_documents")
        .update({ status: 'failed' })
        .eq('id', docData.id);
      throw new Error(`Failed to process paystub: ${error.message}`);
    }
  }

  return { filePath, fileName };
};