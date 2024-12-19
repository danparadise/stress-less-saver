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
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a paystub data extractor. Extract ONLY the following information:
- Gross pay (total earnings before deductions, typically labeled as "Gross Pay", "Total Gross", or "Gross Earnings")
- Net pay (final take-home amount after all deductions, typically labeled as "Net Pay", "Take Home Pay", or "Net Amount")
- Pay period start date
- Pay period end date

CRITICAL INSTRUCTIONS:
1. For monetary values (gross_pay and net_pay):
   - Remove any currency symbols ($) and commas
   - Convert string amounts to numbers
   - Look for clearly labeled sections that show these totals
   - If multiple amounts exist, use the final/total amount
   - Do not include text like "YTD" or year-to-date totals

2. For dates:
   - Format as YYYY-MM-DD
   - Look for "Pay Period" or "Period Ending" dates
   - Ensure dates are within the last year

You MUST return ONLY a valid JSON object with these exact fields:
{
  "gross_pay": number or null,
  "net_pay": number or null,
  "pay_period_start": "YYYY-MM-DD" or null,
  "pay_period_end": "YYYY-MM-DD" or null
}

Rules:
1. ONLY return the JSON object, no additional text
2. If you cannot find a value with high confidence, use null
3. DO NOT use markdown formatting
4. Monetary values MUST be numbers (not strings)`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the paystub information and return ONLY a JSON object with gross_pay, net_pay, and pay period dates."
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
    
    // Additional validation and cleaning of monetary values
    if (parsedData.gross_pay) {
      parsedData.gross_pay = Number(String(parsedData.gross_pay).replace(/[^0-9.-]+/g, ''));
    }
    if (parsedData.net_pay) {
      parsedData.net_pay = Number(String(parsedData.net_pay).replace(/[^0-9.-]+/g, ''));
    }
    
    // Validate the data structure
    if (typeof parsedData.gross_pay !== 'number' && parsedData.gross_pay !== null) {
      console.error('Invalid gross_pay format:', parsedData.gross_pay);
      parsedData.gross_pay = null;
    }
    if (typeof parsedData.net_pay !== 'number' && parsedData.net_pay !== null) {
      console.error('Invalid net_pay format:', parsedData.net_pay);
      parsedData.net_pay = null;
    }

    console.log('Validated and cleaned data:', parsedData);
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