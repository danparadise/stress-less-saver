export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const createErrorResponse = (error: Error, status = 500) => {
  console.error('Error:', error.message);
  return new Response(
    JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
      status 
    }
  );
};