import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    console.log('Processing document:', documentId, 'PDF URL:', pdfUrl)

    if (!documentId || !pdfUrl) {
      throw new Error('Missing required parameters: documentId or pdfUrl')
    }

    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
    if (!pdfCoApiKey) {
      throw new Error('PDF.co API key not configured')
    }

    // Step 1: Get presigned URL for upload
    console.log('Getting presigned URL from PDF.co...')
    const presignedResponse = await fetch(`https://api.pdf.co/v1/file/upload/get-presigned-url?contenttype=application/pdf&name=${documentId}.pdf`, {
      headers: {
        'x-api-key': pdfCoApiKey
      }
    })

    if (!presignedResponse.ok) {
      const errorText = await presignedResponse.text()
      console.error('PDF.co presigned URL error:', errorText)
      throw new Error(`Failed to get presigned URL: ${errorText}`)
    }

    const { presignedUrl, url: uploadedFileUrl } = await presignedResponse.json()
    console.log('Got presigned URL, uploading file...')

    // Step 2: Upload PDF to PDF.co
    const pdfResponse = await fetch(pdfUrl)
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF from storage')
    }
    const pdfBlob = await pdfResponse.blob()

    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: pdfBlob,
      headers: {
        'Content-Type': 'application/pdf'
      }
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload PDF to PDF.co')
    }

    console.log('File uploaded successfully, starting conversion...')

    // Step 3: Convert PDF to PNG
    const convertResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: uploadedFileUrl,
        async: false
      })
    })

    if (!convertResponse.ok) {
      const errorText = await convertResponse.text()
      console.error('PDF.co conversion error:', errorText)
      throw new Error(`PDF.co conversion error: ${errorText}`)
    }

    const result = await convertResponse.json()
    console.log('Conversion result:', result)

    if (!result.urls?.[0]) {
      throw new Error('No converted image URL received from PDF.co')
    }

    // Download the first converted image (assuming single-page documents for now)
    console.log('Downloading converted image...')
    const imageResponse = await fetch(result.urls[0])
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