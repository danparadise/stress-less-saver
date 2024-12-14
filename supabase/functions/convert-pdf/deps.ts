export { serve } from "https://deno.land/std@0.168.0/http/server.ts";
export { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
export { createCanvas } from "https://deno.land/x/canvas@v1.4.1/mod.ts";
// Using a specific version of PDF.js that's known to work with Deno
export { default as pdfjs } from "https://cdn.skypack.dev/pdfjs-dist@2.12.313/build/pdf.js";