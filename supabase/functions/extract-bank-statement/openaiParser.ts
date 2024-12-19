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

    // Ensure all transactions have required fields and correct date format
    const validTransactions = parsedData.transactions.filter((t: any) => {
      const hasRequiredFields = t.date && t.description && 
        (typeof t.amount === 'number') && (typeof t.balance === 'number');
      
      if (!hasRequiredFields) {
        console.warn('Invalid transaction found:', t);
        return false;
      }

      // Keep the date exactly as it comes from the statement
      // Only convert if it's not already in YYYY-MM-DD format
      const dateStr = t.date;
      if (dateStr.includes('/')) {
        // Parse the date considering UTC to avoid timezone issues
        const [month, day, year] = dateStr.split('/');
        // Create date in UTC
        const date = new Date(Date.UTC(
          parseInt(year),
          parseInt(month) - 1, // months are 0-based
          parseInt(day)
        ));
        // Format the date in YYYY-MM-DD while preserving the exact day
        t.date = date.toISOString().split('T')[0];
        console.log(`Converted date from ${dateStr} to ${t.date}`);
      }

      return true;
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
        date: t.date,
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
