// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dfwiszjyvkfmpejsqvbf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmd2lzemp5dmtmbXBlanNxdmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNTc4NDksImV4cCI6MjA0OTczMzg0OX0.ewEildypK1h1fie9mKU69vNEAe1InPcRugf0mp88RBI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);