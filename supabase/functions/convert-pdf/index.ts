import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { documentId, pdfUrl } = await req.json()
    console.log('Processing document:', documentId, 'PDF URL:', pdfUrl)

    if (!documentId || !pdfUrl) {
      throw new Error('Missing required parameters: documentId or pdfUrl')
    }

    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
    if (!pdfCoApiKey) {
      throw new Error('PDF.co API key not configured')
    }

    // Call PDF.co API to convert PDF to PNG
    console.log('Calling PDF.co API for conversion...')
    const apiUrl = `https://api.pdf.co/v1/pdf/convert/to/png`
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pdfUrl,
        async: false,
        inline: false,
        profiles: "png300"  // Using a predefined profile string instead of an object
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('PDF.co API error response:', errorText)
      throw new Error(`PDF.co API error: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log('PDF.co conversion result:', result)

    if (!result.url) {
      throw new Error('No converted image URL received from PDF.co')
    }

    // Download the converted image
    console.log('Downloading converted image...')
    const imageResponse = await fetch(result.url)
    if (!imageResponse.ok) {
      throw new Error('Failed to download converted image')
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upload the converted image to Supabase Storage
    const fileName = `converted/${documentId}.png`
    const { error: uploadError } = await supabase.storage
      .from('financial_docs')
      .upload(fileName, await imageResponse.blob(), {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`Failed to upload converted image: ${uploadError.message}`)
    }

    // Update document status
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId)

    if (updateError) {
      console.error('Document update error:', updateError)
      throw new Error(`Failed to update document status: ${updateError.message}`)
    }

    console.log('Conversion process completed successfully')
    return new Response(
      JSON.stringify({ success: true, message: 'PDF converted and stored successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Conversion error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to convert PDF to image',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})