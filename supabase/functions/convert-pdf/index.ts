import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, createSupabaseClient, convertPdfToPng, validateImageFormat, extractPaystubData, parseExtractedData } from './utils.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { documentId } = await req.json()
    console.log('Processing PDF document:', documentId)

    const supabase = createSupabaseClient()

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
    const { data: pdfData, error: downloadError } = await supabase
      .storage
      .from('financial_docs')
      .download(document.file_path)

    if (downloadError || !pdfData) {
      console.error('Error downloading PDF:', downloadError)
      throw new Error('Failed to download PDF')
    }

    // Convert PDF to PNG with enhanced method
    const pngBuffer = await convertPdfToPng(await pdfData.arrayBuffer())
    
    // Validate the converted image format
    if (!validateImageFormat(pngBuffer)) {
      throw new Error('Converted image is not in valid PNG format')
    }
    
    // Upload the PNG
    const pngFileName = document.file_name.replace('.pdf', '.png')
    const pngPath = document.file_path.replace('.pdf', '.png')

    const { error: uploadError } = await supabase.storage
      .from('financial_docs')
      .upload(pngPath, pngBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading PNG:', uploadError)
      throw uploadError
    }

    // Get the public URL for the PNG
    const { data: { publicUrl } } = supabase.storage
      .from('financial_docs')
      .getPublicUrl(pngPath)

    console.log('Generated public URL for image:', publicUrl)

    // Extract data using OpenAI
    const aiResult = await extractPaystubData(publicUrl)
    console.log('OpenAI API Response:', JSON.stringify(aiResult))

    if (!aiResult.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI')
    }

    // Parse the extracted data
    const extractedData = parseExtractedData(aiResult.choices[0].message.content)

    // Update document status
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({ status: 'completed' })
      .eq('id', documentId)

    if (updateError) {
      console.error('Error updating document status:', updateError)
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
      })

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({ success: true, data: extractedData }),
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