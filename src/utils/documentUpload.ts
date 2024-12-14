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
  const monthYear = format(date, "yyyy-MM-dd");

  console.log('Checking for existing document for month:', monthYear);

  // Check for existing document for this month
  const { data: existingDocs } = await supabase
    .from("financial_documents")
    .select("id, file_path")
    .eq("user_id", user.id)
    .eq("month_year", monthYear)
    .single();

  // If there's an existing document, delete it from storage
  if (existingDocs) {
    console.log('Found existing document, deleting from storage:', existingDocs.file_path);
    
    const { error: deleteError } = await supabase.storage
      .from("financial_docs")
      .remove([existingDocs.file_path]);

    if (deleteError) {
      console.error('Error deleting existing file:', deleteError);
      // Continue anyway as the file might not exist in storage
    }
  }

  console.log('Starting file upload to storage:', filePath);

  // Upload new file to storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("financial_docs")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  console.log('File uploaded successfully, creating/updating document record');

  // Upsert document record
  const { data: docData, error: dbError } = await supabase
    .from("financial_documents")
    .upsert({
      id: existingDocs?.id, // If exists, update the existing record
      document_type: documentType,
      file_path: filePath,
      file_name: file.name,
      month_year: monthYear,
      user_id: user.id,
      status: status
    }, {
      onConflict: 'user_id,month_year'
    })
    .select()
    .single();

  if (dbError) throw dbError;

  console.log('Document record created/updated:', docData.id);

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