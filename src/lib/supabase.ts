import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const supabaseUrl = "https://frfetntxsjfpkkvqxoqf.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyZmV0bnR4c2pmcGtrdnF4b3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1OTI0NTksImV4cCI6MjA1NjE2ODQ1OX0.n33QXjBLcS_leG_0f0Yt57QbHWYjRjheU9xPjXMVSew";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
