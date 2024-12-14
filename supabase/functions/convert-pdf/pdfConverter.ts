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
    console.log('PDF document loaded');
    
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
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Convert canvas to PNG
    console.log('Converting canvas to PNG');
    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error in PDF conversion:', error);
    throw error;
  }
}