import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { 
  corsHeaders, 
  createSupabaseClient, 
  convertPdfToPng, 
  extractPaystubData, 
  parseExtractedData 
} from './utils.ts'

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
      .select('file_path, file_name, document_type')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      console.error('Error fetching document:', fetchError)
      throw new Error('Document not found')
    }

    // Generate a signed URL that will be valid for 60 seconds
    const { data: { signedUrl }, error: signedUrlError } = await supabase
      .storage
      .from('financial_docs')
      .createSignedUrl(document.file_path, 60)

    if (signedUrlError || !signedUrl) {
      console.error('Error generating signed URL:', signedUrlError)
      throw new Error('Failed to generate signed URL')
    }

    // Fetch and convert the PDF
    const pdfResponse = await fetch(signedUrl)
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF file')
    }
    
    const pdfArrayBuffer = await pdfResponse.arrayBuffer()
    const pngBuffer = await convertPdfToPng(pdfArrayBuffer)

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
      await supabase
        .from('financial_documents')
        .update({ status: 'error' })
        .eq('id', documentId)
      throw uploadError
    }

    // Get the public URL for the PNG
    const { data: { publicUrl } } = supabase.storage
      .from('financial_docs')
      .getPublicUrl(pngPath)

    console.log('Generated public URL for image:', publicUrl)

    // If it's a paystub, extract data
    if (document.document_type === 'paystub') {
      try {
        const aiResult = await extractPaystubData(publicUrl)
        console.log('OpenAI API Response:', JSON.stringify(aiResult))

        if (!aiResult.choices?.[0]?.message?.content) {
          throw new Error('Invalid response format from OpenAI')
        }

        const extractedData = parseExtractedData(aiResult.choices[0].message.content)
        console.log('Parsed extracted data:', extractedData)

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
          console.error('Error inserting paystub data:', insertError)
          throw insertError
        }

        console.log('Successfully inserted paystub data')
      } catch (error) {
        console.error('Error processing paystub data:', error)
        throw new Error(`Failed to process paystub data: ${error.message}`)
      }
    }

    // Update the document record
    const { error: updateError } = await supabase
      .from('financial_documents')
      .update({
        file_path: pngPath,
        file_name: pngFileName,
        status: 'completed'
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('Error updating document record:', updateError)
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
        details: error
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})