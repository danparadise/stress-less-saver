import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { join } from "./deps.ts";
import { createClient } from "./deps.ts";
import puppeteer from "./deps.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, pdfUrl } = await req.json();
    console.log('Processing document:', documentId, 'PDF URL:', pdfUrl);

    if (!documentId || !pdfUrl) {
      throw new Error('Missing required parameters: documentId or pdfUrl');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Download PDF from storage
    console.log('Downloading PDF from storage...');
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF from storage');
    }

    // Create temporary directory and save PDF
    const tempDir = await Deno.makeTempDir();
    const pdfPath = join(tempDir, `${documentId}.pdf`);
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    await Deno.writeFile(pdfPath, new Uint8Array(pdfArrayBuffer));

    try {
      // Launch browser with minimal settings
      console.log('Launching browser...');
      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
        ],
      });

      const page = await browser.newPage();

      // Load PDF and convert to PNG
      console.log('Converting PDF to PNG...');
      await page.goto(`file://${pdfPath}`, { waitUntil: 'networkidle0' });
      
      // Set viewport to A4 size at 300 DPI
      await page.setViewport({
        width: 2480,  // A4 width at 300 DPI
        height: 3508, // A4 height at 300 DPI
        deviceScaleFactor: 1,
      });

      // Take screenshot
      const screenshot = await page.screenshot({
        type: 'png',
        fullPage: true,
        omitBackground: true,
      });

      await browser.close();

      // Upload converted image to Supabase Storage
      const fileName = `converted/${documentId}.png`;
      const { error: uploadError } = await supabase.storage
        .from('financial_docs')
        .upload(fileName, screenshot, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Failed to upload converted image: ${uploadError.message}`);
      }

      // Update document status
      const { error: updateError } = await supabase
        .from('financial_documents')
        .update({ status: 'completed' })
        .eq('id', documentId);

      if (updateError) {
        console.error('Document update error:', updateError);
        throw new Error(`Failed to update document status: ${updateError.message}`);
      }

      // Cleanup temporary files
      await Deno.remove(tempDir, { recursive: true });

      console.log('Conversion process completed successfully');
      return new Response(
        JSON.stringify({ success: true, message: 'PDF converted and stored successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Conversion error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to convert PDF to image',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});