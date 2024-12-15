import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getPresignedUrl = async (apiKey: string, fileName: string) => {
  console.log('Getting presigned URL for:', fileName);
  
  const queryPath = `/v1/file/upload/get-presigned-url?contenttype=application/octet-stream&name=${fileName}`;
  const response = await fetch(`https://api.pdf.co${queryPath}`, {
    headers: { "x-api-key": apiKey }
  });

  if (!response.ok) {
    throw new Error(`Failed to get presigned URL: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`PDF.co error: ${data.message}`);
  }

  console.log('Presigned URL obtained successfully');
  return [data.presignedUrl, data.url];
};

const uploadToPdfCo = async (presignedUrl: string, pdfData: ArrayBuffer) => {
  console.log('Uploading PDF to PDF.co');
  
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: pdfData,
    headers: {
      'Content-Type': 'application/octet-stream'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to upload to PDF.co: ${response.statusText}`);
  }

  console.log('PDF uploaded to PDF.co successfully');
};

const convertToImage = async (apiKey: string, uploadedFileUrl: string) => {
  console.log('Converting PDF to PNG');
  
  const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: uploadedFileUrl,
      async: false
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to convert PDF: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`PDF.co conversion error: ${data.message}`);
  }

  if (!data.urls || data.urls.length === 0) {
    throw new Error('No PNG URLs returned from PDF.co');
  }

  console.log(`PDF converted to ${data.urls.length} PNG pages successfully`);
  return data.urls;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { documentId } = await req.json()
    console.log('Processing document:', documentId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY')
    
    if (!supabaseUrl || !supabaseKey || !pdfCoApiKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the document details
    const { data: document, error: docError } = await supabase
      .from('financial_documents')
      .select('file_path, file_name')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      console.error('Error fetching document:', docError)
      throw new Error('Document not found')
    }

    console.log('Document found:', document)

    // Download the PDF file
    const { data: fileData, error: fileError } = await supabase.storage
      .from('financial_docs')
      .download(document.file_path)

    if (fileError || !fileData) {
      throw new Error('Failed to download PDF file')
    }

    // Convert PDF to PNG using PDF.co
    const fileName = `${crypto.randomUUID()}.pdf`
    const [presignedUrl, uploadedFileUrl] = await getPresignedUrl(pdfCoApiKey, fileName)
    await uploadToPdfCo(presignedUrl, await fileData.arrayBuffer())
    const pngUrls = await convertToImage(pdfCoApiKey, uploadedFileUrl)

    // Extract data from all pages using OpenAI
    let bestResult = null
    let highestConfidence = 0

    for (let i = 0; i < pngUrls.length; i++) {
      console.log(`Processing text extraction from page ${i + 1}`)
      try {
        const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "Extract key information from bank statements and return it in a specific JSON format. Return ONLY a raw JSON object with these exact fields: statement_month (YYYY-MM-DD), total_deposits (numeric, no currency symbol or commas), total_withdrawals (numeric, no currency symbol or commas), ending_balance (numeric, no currency symbol or commas). Do not include markdown formatting, code blocks, or any other text."
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract the statement month, total deposits, total withdrawals, and ending balance from this bank statement. Return only a raw JSON object with the specified fields, no markdown or code blocks."
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: pngUrls[i]
                    }
                  }
                ]
              }
            ]
          })
        })

        if (!openAiResponse.ok) {
          const errorData = await openAiResponse.text()
          console.error('OpenAI API error:', errorData)
          continue
        }

        const aiResult = await openAiResponse.json()
        if (!aiResult.choices?.[0]?.message?.content) {
          console.warn('Invalid response format from OpenAI')
          continue
        }

        const content = aiResult.choices[0].message.content.trim()
        console.log('Raw content from OpenAI:', content)
        
        const jsonContent = content.replace(/```json\n|\n```|```/g, '').trim()
        console.log('Cleaned content for parsing:', jsonContent)
        
        const extractedData = JSON.parse(jsonContent)
        
        // Validate the required fields
        const requiredFields = ['statement_month', 'total_deposits', 'total_withdrawals', 'ending_balance']
        const missingFields = requiredFields.filter(field => !(field in extractedData))
        
        if (missingFields.length === 0) {
          // Convert string numbers to actual numbers
          extractedData.total_deposits = Number(String(extractedData.total_deposits).replace(/[^0-9.-]+/g, ''))
          extractedData.total_withdrawals = Number(String(extractedData.total_withdrawals).replace(/[^0-9.-]+/g, ''))
          extractedData.ending_balance = Number(String(extractedData.ending_balance).replace(/[^0-9.-]+/g, ''))

          // Validate date
          const date = new Date(extractedData.statement_month)
          if (!isNaN(date.getTime())) {
            // Simple confidence score based on number of valid fields
            const confidence = Object.values(extractedData).filter(v => v !== null && !isNaN(v)).length
            
            if (confidence > highestConfidence) {
              highestConfidence = confidence
              bestResult = extractedData
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to extract data from page ${i + 1}:`, error)
        continue
      }
    }

    if (!bestResult) {
      throw new Error('Failed to extract valid data from any page')
    }

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
      .from('bank_statement_data')
      .upsert({
        document_id: documentId,
        statement_month: bestResult.statement_month,
        total_deposits: bestResult.total_deposits,
        total_withdrawals: bestResult.total_withdrawals,
        ending_balance: bestResult.ending_balance
      })

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({ success: true, data: bestResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in extract-bank-statement:', error)
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