import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
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
    const { documentId, pdfUrl } = await req.json();
    console.log('Processing document:', documentId, 'PDF URL:', pdfUrl);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download PDF
    console.log('Downloading PDF from:', pdfUrl);
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF');
    }
    const pdfData = await pdfResponse.arrayBuffer();

    // Convert PDF to PNG
    const pngData = await convertPdfToPng(pdfData);

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
      throw new Error(`Failed to upload PNG: ${uploadError.message}`);
    }

    // Get public URL for the uploaded PNG
    const { data: { publicUrl: pngUrl } } = supabase.storage
      .from('financial_docs')
      .getPublicUrl(pngPath);

    console.log('PNG uploaded successfully, URL:', pngUrl);

    // Extract data from the PNG using OpenAI
    const aiResponse = await extractDataFromImage(pngUrl);
    const extractedData = parseExtractedData(aiResponse);

    // Update document status and store extracted data
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document status:', updateError);
      throw updateError;
    }

    // Store the extracted data
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
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
});