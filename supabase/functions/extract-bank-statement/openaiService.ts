export async function extractFinancialData(text: string, apiKey: string) {
  console.log('Starting financial data extraction with OpenAI');
  
  const completion = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Extract only the following information from bank statements:
            - statement_month (the month and year of the statement)
            - total_deposits (sum of all deposits)
            - total_withdrawals (sum of all withdrawals)
            - ending_balance (final balance)
            
            Rules:
            1. For monetary values:
               - Remove currency symbols and commas
               - Convert to plain numbers
               - Use 0 if not found
            2. For statement_month:
               - Format as YYYY-MM-DD (use the first day of the month)
               - Use current month if not found
            
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

  try {
    const extractedData = JSON.parse(result.choices[0].message.content);
    return {
      statement_month: extractedData.statement_month || new Date().toISOString().slice(0, 10),
      total_deposits: extractedData.total_deposits || 0,
      total_withdrawals: extractedData.total_withdrawals || 0,
      ending_balance: extractedData.ending_balance || 0
    };
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    throw new Error('Failed to parse extracted data');
  }
}