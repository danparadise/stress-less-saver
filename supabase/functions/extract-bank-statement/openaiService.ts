const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function extractDataFromImage(imageUrl: string): Promise<Response> {
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Calling OpenAI API with image URL:', imageUrl);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Extract bank statement transactions and return them in a specific JSON format. Include:
            - statement_month (YYYY-MM-DD)
            - total_deposits (numeric)
            - total_withdrawals (numeric)
            - ending_balance (numeric)
            - transactions array with objects containing:
              - date (YYYY-MM-DD)
              - description (string)
              - category (string, inferred from description)
              - amount (numeric, negative for withdrawals)
              - balance (numeric)
            
            Format numbers as plain numbers without currency symbols or commas.
            Return ONLY the JSON object, no markdown or other formatting.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all transaction details from this bank statement image, including dates, descriptions, categories, amounts, and running balances. Format as specified."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 4096,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${errorData}`);
  }

  return response;
}