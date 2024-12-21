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
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are a bank statement analyzer. Extract ALL transactions from the bank statement image and return them in a specific JSON format. 
          
          Critical Rules:
          1. Process EVERY transaction visible in the image, no matter how small
          2. Do not skip any transactions, even if they seem unimportant
          3. If you can't read a value clearly, use null for that field only
          4. For dates: use exactly what's shown in the statement
          5. For amounts:
             - Remove $ and commas
             - Use negative numbers for withdrawals/debits
             - Use positive numbers for deposits/credits
          6. If you see "beginning balance" or "ending balance", include these
          7. If you can't determine the statement month, use the first transaction's month
          8. Always include running balance if available
          
          Required JSON format:
          {
            "statement_month": "YYYY-MM-DD", (first day of the statement month)
            "total_deposits": number (sum of all positive amounts),
            "total_withdrawals": number (sum of absolute values of negative amounts),
            "ending_balance": number (final balance shown),
            "transactions": [
              {
                "date": "MM/DD/YYYY",
                "description": "string",
                "category": "string",
                "amount": number,
                "balance": number
              }
            ]
          }
          
          Return ONLY the JSON object, no additional text or formatting.
          If you can't extract ANY transactions, respond with an error message explaining why.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract ALL transaction details from this bank statement image. Make sure to capture EVERY transaction visible, including the EXACT date as shown, description, amount, and running balance for each one. Do not skip any transactions."
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
      temperature: 0
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${errorData}`);
  }

  return response;
}