export async function extractFinancialData(text: string, apiKey: string) {
  console.log('Starting financial data extraction with OpenAI');
  
  const completion = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a financial data extraction assistant. Extract the following information from bank statements:
            - total_deposits (sum of all deposits)
            - total_withdrawals (sum of all withdrawals)
            - ending_balance (final balance)
            - transactions (array of objects with date, description, amount, and type fields)
            
            Rules:
            1. For monetary values:
               - Remove currency symbols and commas
               - Convert to plain numbers
               - Use null if not found
            2. For dates:
               - Format as YYYY-MM-DD
               - Use null if not found
            3. For transactions:
               - type should be either "deposit" or "withdrawal"
               - amount should be a positive number
               - Return empty array if none found
            
            Return ONLY a valid JSON object with these exact field names.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.1,
    }),
  });

  if (!completion.ok) {
    const errorData = await completion.text();
    console.error('OpenAI API error:', errorData);
    throw new Error('Failed to extract data using OpenAI');
  }

  const result = await completion.json();
  if (!result.choices?.[0]?.message?.content) {
    throw new Error('Invalid response format from OpenAI');
  }

  return JSON.parse(result.choices[0].message.content);
}