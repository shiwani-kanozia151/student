import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Validate environment variables (Vite uses import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://frfetntxsjfpkkvqxoqf.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyZmV0bnR4c2pmcGtrdnF4b3FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1OTI0NTksImV4cCI6MjA1NjE2ODQ1OX0.n33QXjBLcS_leG_0f0Yt57QbHWYjRjheU9xPjXMVSew";

if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL is not defined");
}

if (!supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_ANON_KEY is not defined");
}

// Create and export the typed Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper types (unchanged)
export type Tables = Database["public"]["Tables"];
export type ApplicationsTable = Tables["applications"]["Row"];
export type InsertApplication = Tables["applications"]["Insert"];
export type UpdateApplication = Tables["applications"]["Update"];