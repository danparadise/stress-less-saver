import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { join } from "./deps.ts";
import { createClient } from "./deps.ts";

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

    // Get a base64 encoded version of the PDF for OpenAI
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfArrayBuffer)));

    // Call OpenAI API to analyze the PDF
    console.log('Calling OpenAI API for text extraction...');
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
            content: "You are a paystub analyzer. Extract key information from paystubs and return it in a specific JSON format. Return ONLY a raw JSON object with these exact fields: gross_pay (numeric, no currency symbol or commas), net_pay (numeric, no currency symbol or commas), pay_period_start (YYYY-MM-DD), pay_period_end (YYYY-MM-DD). Do not include markdown formatting, code blocks, or any other text."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract the gross pay, net pay, and pay period dates from this paystub. Return only a raw JSON object with the specified fields, no markdown or code blocks."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!openAiResponse.ok) {
      const errorData = await openAiResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const aiResult = await openAiResponse.json();
    console.log('OpenAI API Response:', JSON.stringify(aiResult));

    if (!aiResult.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Parse the AI response
    let extractedData;
    try {
      const content = aiResult.choices[0].message.content.trim();
      console.log('Raw content from OpenAI:', content);
      
      // Remove any markdown formatting if present
      const jsonContent = content.replace(/```json\n|\n```|```/g, '').trim();
      console.log('Cleaned content for parsing:', jsonContent);
      
      extractedData = JSON.parse(jsonContent);
      
      // Validate the required fields
      const requiredFields = ['gross_pay', 'net_pay', 'pay_period_start', 'pay_period_end'];
      const missingFields = requiredFields.filter(field => !(field in extractedData));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Convert string numbers to actual numbers
      extractedData.gross_pay = Number(String(extractedData.gross_pay).replace(/[^0-9.-]+/g, ''));
      extractedData.net_pay = Number(String(extractedData.net_pay).replace(/[^0-9.-]+/g, ''));

      // Validate dates
      const validateDate = (date: string) => {
        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) {
          throw new Error(`Invalid date format: ${date}`);
        }
        return date;
      };
      
      extractedData.pay_period_start = validateDate(extractedData.pay_period_start);
      extractedData.pay_period_end = validateDate(extractedData.pay_period_end);

      console.log('Parsed and validated extracted data:', extractedData);
    } catch (e) {
      console.error('Failed to parse AI response:', e, 'Raw content:', aiResult.choices[0].message.content);
      throw new Error(`Failed to parse extracted data: ${e.message}`);
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
      });

    if (insertError) {
      throw insertError;
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

    console.log('Document processed successfully');
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document processed and data extracted successfully',
        data: extractedData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process document',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});