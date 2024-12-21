import { ExtractedData, Transaction } from './types.ts';

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

      // Ensure date is in correct format (YYYY-MM-DD)
      const dateStr = t.date;
      if (dateStr.includes('/')) {
        // Convert MM/DD/YYYY to YYYY-MM-DD
        const [month, day, year] = dateStr.split('/');
        t.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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