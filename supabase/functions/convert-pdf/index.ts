import { serve } from "./deps.ts";
import { createClient } from "./deps.ts";
import { corsHeaders, createErrorResponse } from "./config.ts";
import { convertPdfToPng } from "./pdfConverter.ts";
import { extractDataFromImage } from "./openaiService.ts";
import { parseExtractedData } from "./dataProcessor.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PDF conversion process');
    const { documentId, pdfUrl } = await req.json();
    console.log('Processing document:', documentId, 'PDF URL:', pdfUrl);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download PDF
    console.log('Downloading PDF from:', pdfUrl);
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      console.error('Failed to fetch PDF:', pdfResponse.status, pdfResponse.statusText);
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }
    
    console.log('PDF downloaded successfully, converting to ArrayBuffer');
    const pdfData = await pdfResponse.arrayBuffer();
    console.log('PDF data size:', pdfData.byteLength, 'bytes');

    // Convert PDF to PNG
    console.log('Starting PDF to PNG conversion');
    const pngData = await convertPdfToPng(pdfData);
    console.log('PDF converted to PNG successfully');

    // Upload PNG to storage
    const pngPath = `converted/${documentId}.png`;
    console.log('Uploading PNG to storage:', pngPath);
    
    const { error: uploadError } = await supabase.storage
      .from('financial_docs')
      .upload(pngPath, pngData, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Failed to upload PNG:', uploadError);
      throw new Error(`Failed to upload PNG: ${uploadError.message}`);
    }

    // Get public URL for the uploaded PNG
    const { data: { publicUrl: pngUrl } } = supabase.storage
      .from('financial_docs')
      .getPublicUrl(pngPath);

    console.log('PNG uploaded successfully, URL:', pngUrl);

    // Extract data from the PNG using OpenAI
    console.log('Starting text extraction from PNG');
    const aiResponse = await extractDataFromImage(pngUrl);
    console.log('Text extraction completed');
    
    const extractedData = parseExtractedData(aiResponse);
    console.log('Data parsed successfully');

    // Update document status and store extracted data
    console.log('Updating document status');
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document status:', updateError);
      throw updateError;
    }

    // Store the extracted data
    console.log('Storing extracted data');
    const { error: insertError } = await supabase
      .from('paystub_data')
      .insert({
        document_id: documentId,
        gross_pay: extractedData.gross_pay,
        net_pay: extractedData.net_pay,
        pay_period_start: extractedData.pay_period_start,
        pay_period_end: extractedData.pay_period_end,
        extracted_data: extractedData
      });

    if (insertError) {
      console.error('Error inserting extracted data:', insertError);
      throw insertError;
    }

    console.log('Process completed successfully');
    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in PDF conversion process:', error);
    return createErrorResponse(error);
  }
});