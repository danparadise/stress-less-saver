export function parseExtractedData(data: any) {
  console.log('Raw extracted data:', data);
  
  // Validate the required fields exist
  const requiredFields = ['gross_pay', 'net_pay', 'pay_period_start', 'pay_period_end'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // Convert string numbers to actual numbers if they're not null
  if (data.gross_pay !== null) {
    const grossPay = Number(String(data.gross_pay).replace(/[^0-9.-]+/g, ''));
    if (isNaN(grossPay)) {
      console.warn('Invalid gross_pay value, setting to null');
      data.gross_pay = null;
    } else {
      data.gross_pay = grossPay;
    }
  }
  
  if (data.net_pay !== null) {
    const netPay = Number(String(data.net_pay).replace(/[^0-9.-]+/g, ''));
    if (isNaN(netPay)) {
      console.warn('Invalid net_pay value, setting to null');
      data.net_pay = null;
    } else {
      data.net_pay = netPay;
    }
  }
  
  // Validate dates if they're not null
  for (const dateField of ['pay_period_start', 'pay_period_end']) {
    if (data[dateField] !== null) {
      const date = new Date(data[dateField]);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid ${dateField} value, setting to null`);
        data[dateField] = null;
      }
    }
  }
  
  console.log('Parsed and validated data:', data);
  return data;
}