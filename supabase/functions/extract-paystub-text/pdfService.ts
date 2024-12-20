import { corsHeaders } from "./config.ts";

export async function convertPdfToImages(pdfUrl: string): Promise<string[]> {
  console.log('Converting PDF to images:', pdfUrl);
  
  const pdfCoApiKey = Deno.env.get('PDF_CO_API_KEY');
  if (!pdfCoApiKey) {
    throw new Error('PDF_CO_API_KEY is not set');
  }

  try {
    // Step 1: Get PDF Info
    console.log('Retrieving PDF information...');
    const pdfInfoResponse = await fetch('https://api.pdf.co/v1/pdf/info', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        url: pdfUrl,
        async: false
      })
    });

    if (!pdfInfoResponse.ok) {
      const errorText = await pdfInfoResponse.text();
      console.error('Error retrieving PDF info:', errorText);
      throw new Error(`Failed to get PDF info: ${errorText}`);
    }

    const pdfInfo = await pdfInfoResponse.json();
    console.log('PDF info retrieved:', JSON.stringify(pdfInfo, null, 2));

    if (pdfInfo.error) {
      throw new Error(`PDF.co error: ${pdfInfo.message || 'Unknown error getting PDF info'}`);
    }

    const pageCount = pdfInfo.info?.pagecount || 1;
    console.log(`PDF has ${pageCount} pages`);

    // Step 2: Convert PDF to PNG
    console.log('Starting PDF to PNG conversion...');
    const pdfCoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: pdfUrl,
        pages: `1-${pageCount}`,
        async: true,
        renderPageFormObjects: true,
        renderOriginalPageSize: true,
        multiplePagesPerFile: false,
        timeout: 120 // Increase timeout for larger files
      })
    });

    if (!pdfCoResponse.ok) {
      const errorText = await pdfCoResponse.text();
      console.error('Error submitting conversion job:', errorText);
      throw new Error(`Failed to submit PDF conversion job: ${errorText}`);
    }

    const pdfCoData = await pdfCoResponse.json();
    console.log('PDF.co conversion response:', JSON.stringify(pdfCoData, null, 2));

    if (pdfCoData.error) {
      throw new Error(`PDF.co conversion error: ${pdfCoData.message || 'Unknown error during conversion'}`);
    }

    if (!pdfCoData.jobId) {
      throw new Error('No jobId returned from PDF.co');
    }

    // Step 3: Poll for Job Status
    console.log(`Polling job status for jobId: ${pdfCoData.jobId}`);
    const convertedUrls = await pollJobStatus(pdfCoApiKey, pdfCoData.jobId);
    console.log(`Successfully converted ${convertedUrls.length} pages to PNG:`, convertedUrls);
    return convertedUrls;

  } catch (error) {
    console.error('Error in convertPdfToImages:', error);
    throw error;
  }
}

async function pollJobStatus(apiKey: string, jobId: string, interval: number = 3000, maxAttempts: number = 40): Promise<string[]> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Polling job status: Attempt ${attempt}/${maxAttempts}`);
    
    const statusResponse = await fetch(`https://api.pdf.co/v1/job/check?jobid=${jobId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey
      }
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Error checking job status:', errorText);
      throw new Error(`Failed to check job status: ${errorText}`);
    }

    const statusData = await statusResponse.json();
    console.log('Job status response:', JSON.stringify(statusData, null, 2));

    if (statusData.status === 'success') {
      if (!statusData.urls || statusData.urls.length === 0) {
        throw new Error('No PNG URLs returned after job completion');
      }
      return statusData.urls;
    } else if (statusData.status === 'working') {
      console.log(`Job is still processing. Waiting ${interval/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    } else if (statusData.status === 'failed') {
      console.error('Job failed. Full response:', JSON.stringify(statusData, null, 2));
      throw new Error(`Job failed: ${statusData.error || 'Unknown error'}`);
    } else {
      throw new Error(`Unexpected job status: ${statusData.status}`);
    }
  }

  throw new Error(`Conversion timed out after ${maxAttempts} attempts`);
}