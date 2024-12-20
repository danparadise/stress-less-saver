export async function extractDataFromImage(imageUrl: string): Promise<any> {
  console.log('Calling OpenAI API for text extraction from:', imageUrl);
  
  const openAiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: `You are a paystub data extractor. Extract the following information from paystubs:
          - Gross pay (before deductions)
          - Net pay (take-home amount)
          - Pay period start date
          - Pay period end date
          
          Format rules:
          1. For monetary values (gross_pay and net_pay):
             - Remove any currency symbols ($)
             - Remove any commas
             - Convert to plain numbers (e.g., $1,234.56 → 1234.56)
          2. For dates:
             - Format as YYYY-MM-DD
          3. Response format:
             - Return ONLY a valid JSON object
             - Use these exact field names: gross_pay, net_pay, pay_period_start, pay_period_end
             - Use null for any values you cannot extract
          
          Example response:
          {
            "gross_pay": 1234.56,
            "net_pay": 987.65,
            "pay_period_start": "2024-01-01",
            "pay_period_end": "2024-01-15"
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the paystub information following the format rules specified above. Return ONLY a JSON object."
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

  try {
    const content = aiResult.choices[0].message.content.trim();
    console.log('Raw content from OpenAI:', content);
    
    // Remove any markdown formatting if present
    const jsonContent = content.replace(/```json\n|\n```|```/g, '').trim();
    console.log('Cleaned content for parsing:', jsonContent);
    
    const parsedData = JSON.parse(jsonContent);
    return parsedData;
  } catch (error) {
    console.error('Failed to parse OpenAI response:', error);
    throw new Error('Failed to parse extracted data');
  }
}