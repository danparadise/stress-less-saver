const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function extractTextFromPdf(pdfUrl: string, apiKey: string): Promise<string> {
  console.log('Starting PDF text extraction for:', pdfUrl);
  
  const requestData = {
    url: pdfUrl,
    async: false,
    inline: false,
    profiles: ["General"]
  };
  
  // Start the PDF to Text conversion job
  const startJobResponse = await fetch('https://api.pdf.co/v1/pdf/text', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  if (!startJobResponse.ok) {
    const errorData = await startJobResponse.text();
    console.error('PDF.co API error:', errorData);
    throw new Error(`Failed to start PDF conversion job: ${errorData}`);
  }

  const result = await startJobResponse.json();
  
  if (result.error) {
    throw new Error(`PDF.co processing error: ${result.message}`);
  }

  if (!result.body) {
    throw new Error('No text content returned from PDF.co');
  }

  return result.body;
}