export function parseExtractedData(content: string) {
  console.log('Raw content from OpenAI:', content);
  
  // Remove any markdown formatting if present
  const jsonContent = content.replace(/```json\n|\n```|```/g, '').trim();
  console.log('Cleaned content for parsing:', jsonContent);
  
  const extractedData = JSON.parse(jsonContent);
  
  // Validate the required fields
  const requiredFields = ['gross_pay', 'net_pay', 'pay_period_start', 'pay_period_end'];
  const missingFields = requiredFields.filter(field => !(field in extractedData));
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Convert string numbers to actual numbers
  extractedData.gross_pay = Number(String(extractedData.gross_pay).replace(/[^0-9.-]+/g, ''));
  extractedData.net_pay = Number(String(extractedData.net_pay).replace(/[^0-9.-]+/g, ''));

  // Validate dates
  const validateDate = (date: string) => {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date format: ${date}`);
    }
    return date;
  };
  
  extractedData.pay_period_start = validateDate(extractedData.pay_period_start);
  extractedData.pay_period_end = validateDate(extractedData.pay_period_end);

  console.log('Parsed and validated extracted data:', extractedData);
  return extractedData;
}