import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Default to demo values if env vars are not set
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://example.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "your-anon-key";

// Validate URL format
const isValidUrl = (urlString: string) => {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

if (!isValidUrl(supabaseUrl)) {
  console.error(
    "Invalid Supabase URL. Please check your environment variables.",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
