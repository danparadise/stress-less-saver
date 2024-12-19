const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function extractTextFromPdf(pdfUrl: string, apiKey: string): Promise<string> {
  console.log('Starting PDF text extraction for:', pdfUrl);
  
  try {
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
      console.log('No page count found, attempting single page conversion');
      return await convertSinglePage(pdfUrl, apiKey);
    }

    // Convert all pages
    console.log(`Converting ${pageInfo.pageCount} pages`);
    const convertResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pdfUrl,
        pages: "1",  // Start with just the first page
        async: false,
        inline: false
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

    // Download the text content
    const textResponse = await fetch(result.url);
    if (!textResponse.ok) {
      throw new Error('Failed to download converted text');
    }

    const text = await textResponse.text();
    console.log('Successfully extracted text from PDF');
    return text;
  } catch (error) {
    console.error('Error in extractTextFromPdf:', error);
    throw error;
  }
}

async function convertSinglePage(pdfUrl: string, apiKey: string): Promise<string> {
  console.log('Attempting single page conversion');
  const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: pdfUrl,
      pages: "1",
      async: false,
      inline: false
    })
  });

  if (!response.ok) {
    throw new Error(`Single page conversion failed: ${await response.text()}`);
  }

  const result = await response.json();
  console.log('Single page conversion result:', result);

  if (result.error) {
    throw new Error(`Single page conversion failed: ${JSON.stringify(result)}`);
  }

  if (!result.url) {
    throw new Error('No text URL returned from single page conversion');
  }

  // Download the text content
  const textResponse = await fetch(result.url);
  if (!textResponse.ok) {
    throw new Error('Failed to download converted text');
  }

  return await textResponse.text();
}