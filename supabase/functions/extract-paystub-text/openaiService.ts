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
          content: `You are a paystub data extractor. Your task is to find and extract ONLY these specific values:

1. Gross Pay (Total Earnings):
   - Look for labels like: "Gross Pay", "Total Earnings", "Gross Earnings", "Total Gross"
   - Remove any "$" or "," characters
   - Convert to a plain number (e.g., "$1,234.56" → 1234.56)

2. Net Pay (Take-home amount):
   - Look for labels like: "Net Pay", "Take Home Pay", "Net Amount", "Net Earnings"
   - Remove any "$" or "," characters
   - Convert to a plain number (e.g., "$1,234.56" → 1234.56)

3. Pay Period Dates:
   - Look for "Pay Period", "Pay Date Range", or "Period Ending"
   - Return dates in YYYY-MM-DD format

CRITICAL REQUIREMENTS:
1. Return ONLY a valid JSON object with these exact fields:
{
  "gross_pay": number or null,
  "net_pay": number or null,
  "pay_period_start": "YYYY-MM-DD" or null,
  "pay_period_end": "YYYY-MM-DD" or null
}

2. For monetary values:
   - Must be numeric values (not strings)
   - No currency symbols
   - No commas
   - No text descriptions

3. If you can't find a value with high confidence, use null
4. DO NOT include any explanations or text outside the JSON
5. DO NOT use markdown formatting`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the paystub information, focusing especially on finding the gross pay and net pay values. Return ONLY a JSON object."
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
    if (parsedData.gross_pay !== null) {
      const grossPay = Number(String(parsedData.gross_pay).replace(/[^0-9.-]+/g, ''));
      if (isNaN(grossPay)) {
        console.warn('Invalid gross_pay value, setting to null');
        parsedData.gross_pay = null;
      } else {
        parsedData.gross_pay = grossPay;
      }
    }
    
    if (parsedData.net_pay !== null) {
      const netPay = Number(String(parsedData.net_pay).replace(/[^0-9.-]+/g, ''));
      if (isNaN(netPay)) {
        console.warn('Invalid net_pay value, setting to null');
        parsedData.net_pay = null;
      } else {
        parsedData.net_pay = netPay;
      }
    }
    
    // Validate dates if present
    for (const dateField of ['pay_period_start', 'pay_period_end']) {
      if (parsedData[dateField] !== null) {
        const date = new Date(parsedData[dateField]);
        if (isNaN(date.getTime())) {
          console.warn(`Invalid ${dateField} value, setting to null`);
          parsedData[dateField] = null;
        }
      }
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