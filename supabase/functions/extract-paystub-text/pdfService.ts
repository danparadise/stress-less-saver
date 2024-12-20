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
    console.log('PDF info retrieved:', pdfInfo);

    if (!pdfInfo.pageCount && pdfInfo.error) {
      throw new Error(`PDF.co error: ${pdfInfo.message || 'Unknown error getting PDF info'}`);
    }

    const pageCount = pdfInfo.pageCount || 1; // Default to 1 if pageCount is not available
    console.log(`PDF has ${pageCount} pages`);

    // Step 2: Convert PDF to PNG Asynchronously
    console.log(`Submitting conversion job for all ${pageCount} pages to PNG...`);
    const pdfCoResponse = await fetch('https://api.pdf.co/v1/pdf/convert/to/png', {
      method: 'POST',
      headers: {
        'x-api-key': pdfCoApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: pdfUrl,
        pages: "*", // Convert all pages
        async: true, // Asynchronous conversion
        renderPageFormObjects: true,
        renderOriginalPageSize: true,
        multiplePagesPerFile: false // Ensure separate file per page
      })
    });

    if (!pdfCoResponse.ok) {
      const errorText = await pdfCoResponse.text();
      console.error('Error submitting conversion job:', errorText);
      throw new Error(`Failed to submit PDF conversion job: ${errorText}`);
    }

    const pdfCoData = await pdfCoResponse.json();
    console.log('PDF.co job submission response:', pdfCoData);

    if (pdfCoData.error) {
      throw new Error(`PDF.co conversion error: ${pdfCoData.message || 'Unknown error during conversion'}`);
    }

    const jobId = pdfCoData.jobId;
    if (!jobId) {
      throw new Error('No jobId returned from PDF.co.');
    }

    // Step 3: Poll for Job Status
    console.log(`Polling job status for jobId: ${jobId}`);
    const convertedUrls = await pollJobStatus(pdfCoApiKey, jobId);
    console.log(`Successfully converted ${convertedUrls.length} pages to PNG:`, convertedUrls);
    return convertedUrls;

  } catch (error) {
    console.error('Error in convertPdfToImages:', error);
    throw error;
  }
}

async function pollJobStatus(apiKey: string, jobId: string, interval: number = 5000, maxAttempts: number = 20): Promise<string[]> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`Polling job status: Attempt ${attempt}/${maxAttempts}...`);
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
    console.log('Job status:', statusData.status);

    if (statusData.status === 'success') {
      if (!statusData.urls || statusData.urls.length === 0) {
        throw new Error('No PNG URLs returned after job completion.');
      }
      return statusData.urls;
    } else if (statusData.status === 'working') {
      console.log(`Job is still processing. Waiting for ${interval / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, interval));
    } else {
      throw new Error(`Job failed with status: ${statusData.status}`);
    }
  }

  throw new Error('Polling timed out. The conversion job did not complete within the expected time.');
}