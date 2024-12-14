export async function extractDataFromImage(imageUrl: string): Promise<any> {
  console.log('Calling OpenAI API for text extraction');
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
          content: "You are a paystub data extractor. You must ALWAYS respond with a valid JSON object containing exactly these fields: gross_pay (numeric), net_pay (numeric), pay_period_start (YYYY-MM-DD), pay_period_end (YYYY-MM-DD). Do not include any explanations or additional text, only return the JSON object."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the gross pay, net pay, and pay period dates from this paystub. Return only a JSON object with the specified fields."
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

  // Add additional validation to ensure we get valid JSON
  try {
    const content = aiResult.choices[0].message.content.trim();
    console.log('Raw content from OpenAI:', content);
    return content;
  } catch (error) {
    console.error('Failed to parse OpenAI response:', error);
    throw new Error('Failed to get valid JSON response from OpenAI');
  }
}