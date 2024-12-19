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
          content: `You are a paystub data extractor that ONLY returns valid JSON objects. Your task is to find and extract ONLY these specific values:

1. Gross Pay (Total Earnings):
   - Look for labels like: "Gross Pay", "Total Earnings", "Gross Earnings", "Total Gross"
   - Must be a number without "$" or "," characters
   - If not found with high confidence, use null

2. Net Pay (Take-home amount):
   - Look for labels like: "Net Pay", "Take Home Pay", "Net Amount", "Net Earnings"
   - Must be a number without "$" or "," characters
   - If not found with high confidence, use null

3. Pay Period Dates:
   - Look for "Pay Period", "Pay Date Range", or "Period Ending"
   - Must be in YYYY-MM-DD format
   - If not found with high confidence, use null

YOU MUST:
1. Return ONLY a valid JSON object with these exact fields:
{
  "gross_pay": number or null,
  "net_pay": number or null,
  "pay_period_start": "YYYY-MM-DD" or null,
  "pay_period_end": "YYYY-MM-DD" or null
}

2. NEVER include any explanations or text outside the JSON
3. NEVER use markdown formatting or code blocks
4. If you can't extract data, return the JSON with all null values
5. NEVER return any other response format`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the paystub information, focusing on gross pay, net pay, and pay period dates. Return ONLY a JSON object."
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
    // Remove any unexpected characters or formatting
    const cleanContent = content
      .replace(/```json\n|\n```|```/g, '')  // Remove markdown
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