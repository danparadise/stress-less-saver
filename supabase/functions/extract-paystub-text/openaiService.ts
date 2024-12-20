export async function extractDataFromText(text: string): Promise<any> {
  console.log('Processing text with OpenAI, text length:', text.length);
  
  const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a specialized paystub data extractor. Extract the following fields from the paystub text:
          - Gross Pay (total earnings before deductions)
          - Net Pay (final take-home amount)
          - Pay Period Start Date (in YYYY-MM-DD format)
          - Pay Period End Date (in YYYY-MM-DD format)
          
          Rules:
          1. Return numbers as plain numbers without currency symbols or commas
          2. Format all dates as YYYY-MM-DD
          3. If a value cannot be found, return null
          4. Look for "Period Beginning" and "Period Ending" for dates
          5. For Gross Pay, look for "Gross Pay" or total earnings
          6. For Net Pay, look for "Net Pay" or final amount
          7. Remove any whitespace or special characters from numbers
          
          Return ONLY a JSON object with these fields:
          {
            "gross_pay": number or null,
            "net_pay": number or null,
            "pay_period_start": "YYYY-MM-DD" or null,
            "pay_period_end": "YYYY-MM-DD" or null
          }`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0
    })
  });

  if (!openAiResponse.ok) {
    const errorData = await openAiResponse.text();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${errorData}`);
  }

  const result = await openAiResponse.json();
  console.log('OpenAI API Response:', JSON.stringify(result));

  if (!result.choices?.[0]?.message?.content) {
    throw new Error('Invalid response format from OpenAI');
  }

  try {
    const parsedData = JSON.parse(result.choices[0].message.content.trim());
    console.log('Successfully parsed extracted data:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('Failed to parse OpenAI response:', error);
    throw new Error('Failed to parse extracted data');
  }
}