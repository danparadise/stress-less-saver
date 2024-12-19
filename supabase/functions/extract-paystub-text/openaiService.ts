import { corsHeaders } from "./config.ts";

export async function extractDataFromImage(imageUrl: string): Promise<any> {
  console.log('Calling OpenAI API for text extraction from image:', imageUrl);
  const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are a paystub data extractor. Extract ONLY the following information:
- Gross pay (before deductions, total earnings)
- Net pay (take-home amount, amount after deductions)
- Pay period start date
- Pay period end date

CRITICAL: You MUST return ONLY a valid JSON object with these exact fields:
{
  "gross_pay": number or null,
  "net_pay": number or null,
  "pay_period_start": "YYYY-MM-DD" or null,
  "pay_period_end": "YYYY-MM-DD" or null
}

Rules:
1. For monetary values:
   - Remove any currency symbols ($)
   - Remove any commas
   - Convert to plain numbers (e.g., "1,234.56" becomes 1234.56)
   - Must be numeric values, not strings
2. Format dates as YYYY-MM-DD
3. Use null for any values you cannot extract
4. DO NOT include any explanations or text outside the JSON
5. DO NOT use markdown formatting
6. Look for terms like:
   - Gross Pay, Total Earnings, Gross Earnings for gross_pay
   - Net Pay, Take Home Pay, Net Amount for net_pay`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the paystub information and return ONLY a JSON object."
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
      max_tokens: 1000
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

  const content = aiResult.choices[0].message.content.trim();
  console.log('Raw content from OpenAI:', content);
  
  try {
    const parsedData = JSON.parse(content);
    console.log('Parsed paystub data:', parsedData);
    
    // Ensure numeric values for pay amounts
    if (parsedData.gross_pay) {
      parsedData.gross_pay = Number(parsedData.gross_pay);
    }
    if (parsedData.net_pay) {
      parsedData.net_pay = Number(parsedData.net_pay);
    }
    
    return parsedData;
  } catch (error) {
    console.error('Failed to parse OpenAI response:', error);
    return {
      gross_pay: null,
      net_pay: null,
      pay_period_start: null,
      pay_period_end: null
    };
  }
}