import { PDFInfo, PDFPageData } from './types.ts';

export async function processPDFPages(pdfUrl: string, pdfCoApiKey: string): Promise<PDFPageData> {
  // 1. Get PDF info
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

  const pdfInfo: PDFInfo = await pdfInfoResponse.json();
  console.log('PDF info:', pdfInfo);

  // 2. Convert PDF to PNG - all pages
  console.log('Converting PDF pages to PNG');
  const pdfCoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
    method: 'POST',
    headers: {
      'x-api-key': pdfCoApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: pdfUrl,
      pages: `1-${pdfInfo.pageCount}`, // Convert all pages
      async: false
    })
  });

  if (!pdfCoResponse.ok) {
    const errorText = await pdfCoResponse.text();
    console.error('PDF conversion error:', errorText);
    throw new Error(`Failed to convert PDF: ${errorText}`);
  }

  const pdfCoData = await pdfCoResponse.json();
  if (!pdfCoData.urls || pdfCoData.urls.length === 0) {
    throw new Error('No PNG URLs returned from PDF.co');
  }

  console.log(`Successfully converted ${pdfCoData.urls.length} pages to PNG`);
  return { pageUrls: pdfCoData.urls, pageCount: pdfInfo.pageCount };
}