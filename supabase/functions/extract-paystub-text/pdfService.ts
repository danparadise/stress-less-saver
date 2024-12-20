import { corsHeaders } from "./config.ts";

export async function convertPdfToImages(pdfUrl: string): Promise<string[]> {
  console.log('Converting PDF to images:', pdfUrl);
  
  const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY');
  if (!pdfCoApiKey) {
    throw new Error('PDF_CO_API_KEY is not set');
  }

  // First, get PDF info to know how many pages we have
  console.log('Getting PDF info');
  const pdfInfoResponse = await fetch('https://api.pdf.co/v1/pdf/info', {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: pdfUrl })
  });

  if (!pdfInfoResponse.ok) {
    const errorText = await pdfInfoResponse.text();
    console.error('PDF info error:', errorText);
    throw new Error(`Failed to get PDF info: ${errorText}`);
  }

  const pdfInfo = await pdfInfoResponse.json();
  console.log('PDF info:', pdfInfo);

  // Convert PDF to PNG with explicit page range and profile settings
  console.log(`Converting ${pdfInfo.pageCount} pages to PNG`);
  const pdfCoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: pdfUrl,
      pages: `1-${pdfInfo.pageCount}`,  // Explicitly specify all pages
      async: false,
      profiles: "document-photos",       // Use document-photos profile for better quality
      renderPageFormObjects: true,       // Ensure form objects are rendered
      renderOriginalPageSize: true,      // Maintain original page dimensions
      multiplePagesPerFile: false        // Generate separate file for each page
    })
  });

  if (!pdfCoResponse.ok) {
    const errorText = await pdfCoResponse.text();
    console.error('PDF conversion error:', errorText);
    throw new Error(`Failed to convert PDF: ${errorText}`);
  }

  const pdfCoData = await pdfCoResponse.json();
  console.log('PDF.co conversion response:', pdfCoData);
  
  if (!pdfCoData.urls || pdfCoData.urls.length === 0) {
    throw new Error('No PNG URLs returned from PDF.co');
  }

  console.log(`Successfully converted ${pdfCoData.urls.length} pages to PNG`);
  return pdfCoData.urls;
}