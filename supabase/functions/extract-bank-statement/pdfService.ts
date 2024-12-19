const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function extractTextFromPdf(pdfUrl: string, apiKey: string): Promise<string> {
  console.log('Starting PDF text extraction for:', pdfUrl);
  
  // First, get a presigned URL for the job
  const presignedResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: pdfUrl,
      async: false,
      inline: false,
      profiles: ["General"]
    })
  });

  if (!presignedResponse.ok) {
    const errorData = await presignedResponse.text();
    console.error('PDF.co API error:', errorData);
    throw new Error(`Failed to start PDF conversion job: ${errorData}`);
  }

  const result = await presignedResponse.json();
  console.log('PDF.co conversion response:', result);
  
  if (result.error) {
    throw new Error(`PDF.co processing error: ${result.message}`);
  }

  if (!result.url) {
    throw new Error('No text content URL returned from PDF.co');
  }

  // Download the text content
  const textResponse = await fetch(result.url);
  if (!textResponse.ok) {
    throw new Error('Failed to download converted text');
  }

  const text = await textResponse.text();
  console.log('Successfully extracted text from PDF');
  return text;
}