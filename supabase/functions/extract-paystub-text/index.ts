import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from "./config.ts";
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
    
    if (!documentId || !pdfUrl) {
      throw new Error('Missing required parameters: documentId or pdfUrl');
    }
    
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
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }
    
    const pdfData = await pdfResponse.arrayBuffer();
    console.log('PDF downloaded successfully, size:', pdfData.byteLength, 'bytes');

    // Convert PDF to PNG
    console.log('Starting PDF to PNG conversion');
    const pngDataArray = await convertPdfToPng(pdfData);
    console.log('PDF converted to PNG successfully');

    // Upload all PNG pages to storage
    const uploadedPngUrls = [];
    for (let i = 0; i < pngDataArray.length; i++) {
      const pngPath = `converted/${documentId}_page${i + 1}.png`;
      console.log('Uploading PNG to storage:', pngPath);
      
      const { error: uploadError } = await supabase.storage
        .from('financial_docs')
        .upload(pngPath, pngDataArray[i], {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Failed to upload PNG page ${i + 1}: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('financial_docs')
        .getPublicUrl(pngPath);
      
      uploadedPngUrls.push(publicUrl);
    }

    console.log('All PNG pages uploaded successfully');

    // Extract data from all pages
    let bestResult = null;
    let highestConfidence = 0;

    for (let i = 0; i < uploadedPngUrls.length; i++) {
      console.log(`Processing text extraction from page ${i + 1}`);
      try {
        const extractedData = await extractDataFromImage(uploadedPngUrls[i]);
        const parsedData = parseExtractedData(extractedData);
        
        // Simple confidence score based on number of non-null values
        const confidence = Object.values(parsedData).filter(v => v !== null).length;
        
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestResult = parsedData;
        }
      } catch (error) {
        console.warn(`Failed to extract data from page ${i + 1}:`, error);
        continue;
      }
    }

    if (!bestResult) {
      throw new Error('Failed to extract data from any page');
    }

    // Update document status
    console.log('Updating document status');
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Error updating document status: ${updateError.message}`);
    }

    // Insert the extracted data
    console.log('Storing extracted data in paystub_data table');
    const { error: insertError } = await supabase
      .from('paystub_data')
      .insert({
        document_id: documentId,
        gross_pay: bestResult.gross_pay,
        net_pay: bestResult.net_pay,
        pay_period_start: bestResult.pay_period_start,
        pay_period_end: bestResult.pay_period_end,
        extracted_data: bestResult
      });

    if (insertError) {
      console.error('Error inserting data:', insertError);
      throw new Error(`Error inserting extracted data: ${insertError.message}`);
    }

    console.log('Process completed successfully');
    return new Response(
      JSON.stringify({ success: true, data: bestResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in PDF conversion process:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});