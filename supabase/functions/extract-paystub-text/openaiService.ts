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
          content: `You are a specialized paystub data extractor. Your task is to carefully analyze paystub images and extract specific financial data with high accuracy.

EXTRACTION RULES:
1. Look for these specific values:

   GROSS PAY:
   - Common labels: "Gross Pay", "Total Gross", "Gross Earnings", "Total Earnings", "Current Gross"
   - Include all earnings before deductions
   - Return as a plain number (e.g., 1234.56)
   - If multiple gross pay values exist, use the one labeled as current/this period

   NET PAY:
   - Common labels: "Net Pay", "Take Home Pay", "Net Amount", "Net Earnings", "Amount Paid"
   - The final amount after all deductions
   - Usually the largest bold number or in a "TOTAL" row
   - Return as a plain number (e.g., 1234.56)

   PAY PERIOD:
   - Look for "Pay Period", "Pay Date Range", "Period Beginning/Ending"
   - Must find both start and end dates
   - Return in YYYY-MM-DD format
   - If only one date is found, use it for both start and end

2. Data Cleaning:
   - Remove all currency symbols ($)
   - Remove all commas from numbers
   - Convert all dates to YYYY-MM-DD format
   - Return null for any value you cannot find or are uncertain about

3. Response Format:
{
  "gross_pay": number or null,
  "net_pay": number or null,
  "pay_period_start": "YYYY-MM-DD" or null,
  "pay_period_end": "YYYY-MM-DD" or null
}

IMPORTANT:
- Return ONLY the JSON object, no explanations
- Never include markdown formatting
- If you can't find a value with high confidence, return null
- Double-check all numbers for accuracy
- Ensure dates are properly formatted`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the paystub information, focusing on gross pay, net pay, and pay period dates. Be thorough in searching for these values across the entire document. Return ONLY a JSON object."
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
      max_tokens: 1000,
      temperature: 0 // Use 0 for maximum precision
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
    // Remove any unexpected characters or formatting
    const cleanContent = content
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .trim();
    
    console.log('Cleaned content for parsing:', cleanContent);
    
    const parsedData = JSON.parse(cleanContent);
    console.log('Successfully parsed JSON:', parsedData);
    
    // Validate and clean the data
    const validatedData = {
      gross_pay: parsedData.gross_pay !== null ? 
        Number(String(parsedData.gross_pay).replace(/[^0-9.-]+/g, '')) : null,
      net_pay: parsedData.net_pay !== null ? 
        Number(String(parsedData.net_pay).replace(/[^0-9.-]+/g, '')) : null,
      pay_period_start: parsedData.pay_period_start,
      pay_period_end: parsedData.pay_period_end
    };

    // Validate numbers
    if (validatedData.gross_pay !== null && isNaN(validatedData.gross_pay)) {
      validatedData.gross_pay = null;
    }
    if (validatedData.net_pay !== null && isNaN(validatedData.net_pay)) {
      validatedData.net_pay = null;
    }

    // Validate dates
    for (const dateField of ['pay_period_start', 'pay_period_end'] as const) {
      if (validatedData[dateField]) {
        const date = new Date(validatedData[dateField]);
        if (isNaN(date.getTime())) {
          validatedData[dateField] = null;
        }
      }
    }

    return validatedData;
  } catch (error) {
    console.error('Failed to parse OpenAI response:', error);
    console.error('Failed content:', content);
    return {
      gross_pay: null,
      net_pay: null,
      pay_period_start: null,
      pay_period_end: null
    };
  }
}