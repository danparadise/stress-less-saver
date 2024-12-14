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
          content: "You are a paystub data extractor. Extract numeric values for gross pay and net pay, removing any currency symbols or commas. Format dates as YYYY-MM-DD. If you cannot extract the data, return a JSON with null values. Your response must ALWAYS be a valid JSON object with these exact fields: gross_pay, net_pay, pay_period_start, pay_period_end. Never include explanations or additional text."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the following from this paystub image and return ONLY a JSON object: gross_pay (number without currency symbols/commas), net_pay (number without currency symbols/commas), pay_period_start (YYYY-MM-DD), pay_period_end (YYYY-MM-DD). If any value cannot be extracted, use null."
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
    
    // Parse the JSON content
    const parsedData = JSON.parse(content);
    
    // Validate the required fields exist
    const requiredFields = ['gross_pay', 'net_pay', 'pay_period_start', 'pay_period_end'];
    for (const field of requiredFields) {
      if (!(field in parsedData)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Convert string numbers to actual numbers if they're not null
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
    
    // Validate dates if they're not null
    for (const dateField of ['pay_period_start', 'pay_period_end']) {
      if (parsedData[dateField] !== null) {
        const date = new Date(parsedData[dateField]);
        if (isNaN(date.getTime())) {
          console.warn(`Invalid ${dateField} value, setting to null`);
          parsedData[dateField] = null;
        }
      }
    }
    
    console.log('Parsed and validated data:', parsedData);
    return JSON.stringify(parsedData);
  } catch (error) {
    console.error('Failed to parse or validate OpenAI response:', error);
    // Return a valid JSON with null values instead of throwing
    return JSON.stringify({
      gross_pay: null,
      net_pay: null,
      pay_period_start: null,
      pay_period_end: null
    });
  }
}