import { corsHeaders } from "./config.ts";

export async function convertPdfToImages(pdfUrl: string): Promise<string[]> {
  console.log('Converting PDF to images:', pdfUrl);
  const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY');
  
  if (!pdfCoApiKey) {
    throw new Error('PDF_CO_API_KEY is not set');
  }

  try {
    // First get PDF info to know how many pages we have
    console.log('Getting PDF info...');
    const pageInfoResponse = await fetch('https://api.pdf.co/v1/pdf/info', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: pdfUrl })
    });

    if (!pageInfoResponse.ok) {
      throw new Error(`Failed to get PDF info: ${await pageInfoResponse.text()}`);
    }

    const pageInfo = await pageInfoResponse.json();
    console.log('PDF info:', pageInfo);

    if (!pageInfo.pageCount) {
      console.log('No page count found, attempting single page conversion');
      return await convertSinglePage(pdfUrl, pdfCoApiKey);
    }

    // Convert all pages
    console.log(`Converting ${pageInfo.pageCount} pages`);
    const convertResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pdfUrl,
        pages: "1-" + pageInfo.pageCount, // Format: "1-N" for all pages
        async: false
      })
    });

    if (!convertResponse.ok) {
      console.error('Multi-page conversion failed, attempting single page');
      return await convertSinglePage(pdfUrl, pdfCoApiKey);
    }

    const result = await convertResponse.json();
    console.log('Conversion result:', result);

    if (result.error) {
      console.error('PDF conversion error:', result);
      throw new Error(`PDF conversion failed: ${JSON.stringify(result)}`);
    }

    if (!result.urls || result.urls.length === 0) {
      throw new Error('No image URLs returned from conversion');
    }

    return result.urls;
  } catch (error) {
    console.error('Error in convertPdfToImages:', error);
    throw error;
  }
}

async function convertSinglePage(pdfUrl: string, apiKey: string): Promise<string[]> {
  console.log('Attempting single page conversion');
  const response = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: pdfUrl,
      pages: "1",
      async: false
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

  if (!result.urls || result.urls.length === 0) {
    throw new Error('No image URLs returned from single page conversion');
  }

  return result.urls;
}