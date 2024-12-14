import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Convert PDF Edge Function starting...")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request")
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  try {
    // Parse request body
    const { documentId, pdfUrl } = await req.json()
    console.log('Processing PDF document:', documentId, 'URL:', pdfUrl)

    if (!documentId || !pdfUrl) {
      throw new Error('Missing required parameters: documentId or pdfUrl')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the document details
    const { data: document, error: fetchError } = await supabase
      .from('financial_documents')
      .select('file_path, file_name')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      console.error('Error fetching document:', fetchError)
      throw new Error('Document not found')
    }

    // Download the PDF file
    console.log('Downloading PDF from URL:', pdfUrl)
    const pdfResponse = await fetch(pdfUrl)
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`)
    }

    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
    if (!pdfCoApiKey) {
      throw new Error('PDF_CO_API_KEY is not set')
    }

    // Convert PDF to image using PDF.co API
    console.log('Converting PDF to image using PDF.co API')
    const imageResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pdfUrl,
        async: false,
        inline: false,
        profiles: ["default"]
      })
    })

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text()
      console.error('PDF.co API error:', errorText)
      throw new Error(`PDF.co API error: ${errorText}`)
    }

    const conversionResult = await imageResponse.json()
    console.log('PDF.co conversion result:', conversionResult)
    
    if (!conversionResult.url) {
      throw new Error('No image URL in conversion response')
    }

    // Download the converted image
    console.log('Downloading converted image from:', conversionResult.url)
    const imageData = await fetch(conversionResult.url)
    if (!imageData.ok) {
      throw new Error('Failed to download converted image')
    }
    
    const imageBuffer = await imageData.arrayBuffer()

    // Upload the PNG
    const pngFileName = document.file_name.replace('.pdf', '.png')
    const pngPath = document.file_path.replace('.pdf', '.png')

    console.log('Uploading converted PNG:', pngPath)
    const { error: uploadError } = await supabase.storage
      .from('financial_docs')
      .upload(pngPath, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading PNG:', uploadError)
      throw uploadError
    }

    // Get the public URL for analysis
    const { data: { publicUrl } } = supabase.storage
      .from('financial_docs')
      .getPublicUrl(pngPath)

    console.log('Generated public URL for analysis:', publicUrl)

    // Update document status
    console.log('Updating document status to completed')
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId)

    if (updateError) {
      console.error('Error updating document status:', updateError)
      throw updateError
    }

    console.log('Successfully processed PDF document')
    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: publicUrl
      }), 
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error in convert-pdf:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }, 
        status: 500 
      }
    )
  }
})