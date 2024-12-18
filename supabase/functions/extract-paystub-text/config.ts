export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function createErrorResponse(error: Error) {
  console.error('Error in extract-paystub-text:', error);
  return new Response(
    JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status: 500 
    }
  );
}

export function validateExtractedData(data: any) {
  const validatedData = {
    gross_pay: null,
    net_pay: null,
    pay_period_start: null,
    pay_period_end: null
  };

  // Convert string numbers to actual numbers if they're not null
  if (data.gross_pay !== null) {
    const grossPay = Number(String(data.gross_pay).replace(/[^0-9.-]+/g, ''));
    validatedData.gross_pay = !isNaN(grossPay) ? grossPay : null;
  }
  
  if (data.net_pay !== null) {
    const netPay = Number(String(data.net_pay).replace(/[^0-9.-]+/g, ''));
    validatedData.net_pay = !isNaN(netPay) ? netPay : null;
  }
  
  // Validate dates if they're not null
  for (const dateField of ['pay_period_start', 'pay_period_end'] as const) {
    if (data[dateField] !== null) {
      const date = new Date(data[dateField]);
      validatedData[dateField] = !isNaN(date.getTime()) ? data[dateField] : null;
    }
  }

  return validatedData;
}