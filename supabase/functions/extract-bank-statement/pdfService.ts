const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function extractTextFromPdf(pdfUrl: string, apiKey: string): Promise<string> {
  console.log('Starting PDF text extraction for:', pdfUrl);
  
  // First, get the page count
  const pageInfoResponse = await fetch('https://api.pdf.co/v1/pdf/info', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: pdfUrl })
  });

  if (!pageInfoResponse.ok) {
    const errorData = await pageInfoResponse.text();
    console.error('PDF info error:', errorData);
    throw new Error(`Failed to get PDF info: ${errorData}`);
  }

  const pageInfo = await pageInfoResponse.json();
  console.log('PDF info:', pageInfo);

  if (!pageInfo.pageCount) {
    throw new Error('Could not determine page count from PDF');
  }

  // Convert all pages
  const pageRange = Array.from({ length: pageInfo.pageCount }, (_, i) => i + 1).join(',');
  console.log(`Converting PDF pages ${pageRange}`);

  const convertResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: pdfUrl,
      pages: pageRange,
      async: false,
      inline: false,
      profiles: ["General"]
    })
  });

  if (!convertResponse.ok) {
    const errorData = await convertResponse.text();
    console.error('PDF conversion error:', errorData);
    throw new Error(`Failed to convert PDF: ${errorData}`);
  }

  const result = await convertResponse.json();
  console.log('PDF conversion response:', result);
  
  if (result.error) {
    throw new Error(`PDF processing error: ${result.message}`);
  }

  if (!result.url) {
    throw new Error('No text content URL returned from PDF.co');
  }

  // Download all text content
  const textResponse = await fetch(result.url);
  if (!textResponse.ok) {
    throw new Error('Failed to download converted text');
  }

  const text = await textResponse.text();
  console.log('Successfully extracted text from all PDF pages');
  return text;
}