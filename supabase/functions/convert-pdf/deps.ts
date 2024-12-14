export { serve } from "https://deno.land/std@0.168.0/http/server.ts";
export { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
export { createCanvas } from "https://deno.land/x/canvas@v1.4.1/mod.ts";
// Using the ESM build of PDF.js that's compatible with Deno
export { getDocument } from "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/es5/build/pdf.js";