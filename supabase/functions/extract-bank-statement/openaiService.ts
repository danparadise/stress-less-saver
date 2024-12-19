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
          content: `You are a bank statement analyzer. Extract ALL transactions from the bank statement image and return them in a specific JSON format. 
          
          Rules:
          1. Process EVERY SINGLE transaction visible in the image
          2. Do not skip any transactions
          3. If you can't read a value clearly, use null instead of guessing
          4. Format all dates as YYYY-MM-DD
          5. Format all numbers as plain numbers without currency symbols or commas
          6. For withdrawals, use negative numbers
          7. For deposits, use positive numbers
          
          Required JSON format:
          {
            "statement_month": "YYYY-MM-DD",
            "total_deposits": number,
            "total_withdrawals": number (as a positive number),
            "ending_balance": number,
            "transactions": [
              {
                "date": "YYYY-MM-DD",
                "description": "string",
                "category": "string",
                "amount": number,
                "balance": number
              }
            ]
          }
          
          Return ONLY the JSON object, no additional text or formatting.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract ALL transaction details from this bank statement image. Make sure to capture EVERY SINGLE transaction visible, including the date, description, amount, and running balance for each one. Do not skip any transactions."
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