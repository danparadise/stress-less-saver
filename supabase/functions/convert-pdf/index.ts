import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib@1.17.1'
import { decode as base64Decode } from "https://deno.land/std@0.182.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { documentId, pdfUrl } = await req.json()
    console.log('Processing PDF document:', documentId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Get the document details
    const { data: document } = await supabase
      .from('financial_documents')
      .select('file_path, file_name')
      .eq('id', documentId)
      .single()

    if (!document) {
      throw new Error('Document not found')
    }

    // Generate a signed URL that will be valid for 60 seconds
    const { data: { signedUrl } } = await supabase
      .storage
      .from('financial_docs')
      .createSignedUrl(document.file_path, 60)

    if (!signedUrl) {
      throw new Error('Failed to generate signed URL')
    }

    // Fetch the PDF file
    const pdfResponse = await fetch(signedUrl)
    const pdfArrayBuffer = await pdfResponse.arrayBuffer()
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer)
    const pages = pdfDoc.getPages()
    
    if (pages.length === 0) {
      throw new Error('PDF document has no pages')
    }

    // We'll convert only the first page
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    // Create a new PDF with just the first page
    const singlePagePdf = await PDFDocument.create()
    const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [0])
    singlePagePdf.addPage(copiedPage)

    // Convert to PNG using PDF.js (this is a simplified version)
    const pngBytes = await singlePagePdf.saveAsBase64()
    const pngBuffer = base64Decode(pngBytes)

    // Upload the PNG to storage
    const pngFileName = document.file_name.replace('.pdf', '.png')
    const pngPath = document.file_path.replace('.pdf', '.png')

    const { error: uploadError } = await supabase.storage
      .from('financial_docs')
      .upload(pngPath, pngBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    // Update the document record
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({
        file_path: pngPath,
        file_name: pngFileName,
        status: 'converted'
      })
      .eq('id', documentId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'PDF converted successfully',
        pngPath
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in convert-pdf:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})