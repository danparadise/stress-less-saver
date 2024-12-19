interface Transaction {
  date: string;
  description: string;
  category: string;
  amount: number;
  balance: number;
}

interface ExtractedData {
  statement_month: string;
  total_deposits: number;
  total_withdrawals: number;
  ending_balance: number;
  transactions: Transaction[];
}

export function parseOpenAIResponse(content: string): ExtractedData {
  console.log('Parsing OpenAI response content:', content);
  
  // Remove markdown code blocks if present
  const cleanContent = content.replace(/```json\n|\n```|```/g, '').trim();
  console.log('Cleaned content:', cleanContent);
  
  try {
    const parsedData = JSON.parse(cleanContent);
    console.log('Successfully parsed JSON:', parsedData);
    
    // Validate the parsed data structure
    if (!parsedData.statement_month || !Array.isArray(parsedData.transactions)) {
      console.error('Invalid data structure:', parsedData);
      throw new Error('Invalid data structure in parsed response');
    }

    // Ensure all transactions have required fields
    const validTransactions = parsedData.transactions.filter((t: any) => {
      return t.date && t.description && (typeof t.amount === 'number') && (typeof t.balance === 'number');
    });

    if (validTransactions.length === 0) {
      console.error('No valid transactions found in:', parsedData.transactions);
      throw new Error('No valid transactions found in parsed response');
    }
    
    return {
      statement_month: parsedData.statement_month,
      total_deposits: Number(parsedData.total_deposits) || 0,
      total_withdrawals: Number(parsedData.total_withdrawals) || 0,
      ending_balance: Number(parsedData.ending_balance) || 0,
      transactions: validTransactions.map((t: any) => ({
        date: String(t.date || ''),
        description: String(t.description || ''),
        category: String(t.category || 'Uncategorized'),
        amount: Number(t.amount) || 0,
        balance: Number(t.balance) || 0
      }))
    };
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    console.error('Failed content:', cleanContent);
    throw new Error(`Failed to parse extracted data: ${error.message}`);
  }
}