import { createCanvas } from "https://deno.land/x/canvas@v1.4.1/mod.ts";
import { pdfjs } from "./deps.ts";

// Configure the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.skypack.dev/pdfjs-dist@2.12.313/build/pdf.worker.min.js`;

export async function convertPdfToPng(pdfData: ArrayBuffer): Promise<Uint8Array> {
  console.log('Loading PDF with PDF.js');
  
  try {
    // Initialize PDF.js
    console.log('Creating PDF document task');
    const loadingTask = pdfjs.getDocument({ data: pdfData });
    console.log('PDF loading task created');
    
    const pdf = await loadingTask.promise;
    console.log('PDF document loaded, total pages:', pdf.numPages);
    
    const page = await pdf.getPage(1); // Get first page
    console.log('First page retrieved');
    
    const viewport = page.getViewport({ scale: 2.0 }); // Scale up for better quality
    console.log('Viewport created with dimensions:', viewport.width, 'x', viewport.height);

    // Create canvas
    console.log('Creating canvas for PDF rendering');
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    // Render PDF page to canvas
    console.log('Rendering PDF to canvas');
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };

    try {
      await page.render(renderContext).promise;
      console.log('PDF rendered to canvas successfully');
    } catch (renderError) {
      console.error('Error rendering PDF to canvas:', renderError);
      throw new Error(`Failed to render PDF: ${renderError.message}`);
    }

    // Convert canvas to PNG
    console.log('Converting canvas to PNG');
    try {
      const pngData = canvas.toBuffer('image/png');
      console.log('Canvas converted to PNG successfully');
      return pngData;
    } catch (conversionError) {
      console.error('Error converting canvas to PNG:', conversionError);
      throw new Error(`Failed to convert canvas to PNG: ${conversionError.message}`);
    }
  } catch (error) {
    console.error('Error in PDF conversion:', error);
    throw error;
  }
}