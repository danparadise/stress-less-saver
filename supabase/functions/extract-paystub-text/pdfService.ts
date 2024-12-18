import { corsHeaders } from "./config.ts";

export async function convertPdfToImages(pdfUrl: string): Promise<string[]> {
  console.log('Converting PDF to images:', pdfUrl);
  const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY');
  
  if (!pdfCoApiKey) {
    throw new Error('PDF_CO_API_KEY is not set');
  }

  try {
    // First, get the page count
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
      const errorData = await pageInfoResponse.text();
      console.error('PDF info error:', errorData);
      throw new Error(`Failed to get PDF info: ${errorData}`);
    }

    const pageInfo = await pageInfoResponse.json();
    console.log('PDF info:', pageInfo);
    
    if (!pageInfo.pageCount) {
      throw new Error('Could not determine page count from PDF');
    }

    // Convert only the first page if that's all we have, otherwise try first two
    const pageRange = pageInfo.pageCount === 1 ? "1" : "1-2";
    console.log(`Converting PDF pages ${pageRange}`);

    const convertResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pdfUrl,
        pages: pageRange,
        async: false
      })
    });

    if (!convertResponse.ok) {
      const errorData = await convertResponse.text();
      console.error('PDF conversion error:', errorData);
      throw new Error(`PDF conversion failed: ${errorData}`);
    }

    const convertResult = await convertResponse.json();
    console.log('PDF conversion result:', convertResult);

    if (convertResult.error) {
      throw new Error(`PDF conversion failed: ${JSON.stringify(convertResult)}`);
    }

    if (!convertResult.urls || convertResult.urls.length === 0) {
      throw new Error('No image URLs returned from conversion');
    }

    return convertResult.urls;
  } catch (error) {
    console.error('Error in convertPdfToImages:', error);
    throw error;
  }
}