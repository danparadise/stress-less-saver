export function formatAIResponse(response: string): string {
  // Clean up any inconsistencies in the response
  if (response.includes('No transaction data found') && response.includes('you spent')) {
    // Extract the amount if it exists
    const match = response.match(/\$[\d,]+\.?\d*/);
    if (match) {
      return `Based on your transaction data, you spent ${match[0]} in this category.`;
    }
  }
  
  return response;
}