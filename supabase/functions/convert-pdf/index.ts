import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { fromPath } from 'https://esm.sh/pdf2pic@2.1.4'
import { join } from "https://deno.land/std@0.208.0/path/mod.ts"

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

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download PDF from storage
    console.log('Downloading PDF from storage...')
    const pdfResponse = await fetch(pdfUrl)
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF from storage')
    }

    // Save PDF temporarily
    const tempDir = await Deno.makeTempDir()
    const pdfPath = join(tempDir, `${documentId}.pdf`)
    const pdfArrayBuffer = await pdfResponse.arrayBuffer()
    await Deno.writeFile(pdfPath, new Uint8Array(pdfArrayBuffer))

    // Convert PDF to PNG
    console.log('Converting PDF to PNG...')
    const options = {
      density: 300,
      saveFilename: documentId,
      savePath: tempDir,
      format: "png",
      width: 2480,
      height: 3508 // A4 size at 300 DPI
    }

    const convert = fromPath(pdfPath, options)
    const pageToConvertAsImage = 1 // Convert first page

    try {
      const result = await convert(pageToConvertAsImage)
      console.log('Conversion successful:', result)

      // Read the converted image
      const imagePath = join(tempDir, `${documentId}.1.png`)
      const imageData = await Deno.readFile(imagePath)

      // Upload converted image to Supabase Storage
      const fileName = `converted/${documentId}.png`
      const { error: uploadError } = await supabase.storage
        .from('financial_docs')
        .upload(fileName, imageData, {
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

      // Cleanup temporary files
      await Deno.remove(tempDir, { recursive: true })

      console.log('Conversion process completed successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'PDF converted and stored successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('Conversion error:', error)
      throw new Error(`Failed to convert PDF: ${error.message}`)
    }

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