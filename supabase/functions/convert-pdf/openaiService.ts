export async function extractDataFromImage(imageUrl: string): Promise<any> {
  console.log('Calling OpenAI API for text extraction');
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
          content: "You are a paystub analyzer. Extract key information from paystubs and return it in a specific JSON format. Return ONLY a raw JSON object with these exact fields: gross_pay (numeric, no currency symbol or commas), net_pay (numeric, no currency symbol or commas), pay_period_start (YYYY-MM-DD), pay_period_end (YYYY-MM-DD)."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the gross pay, net pay, and pay period dates from this paystub. Return only a raw JSON object with the specified fields."
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

  return aiResult.choices[0].message.content;
}