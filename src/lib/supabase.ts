import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase credentials are not defined in environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Adjust based on your needs
    },
  },
});

// Helper function for real-time subscriptions
export const subscribeToChanges = (table: string, callback: () => void) => {
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
      },
      () => callback()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Your existing type exports
export type Tables = Database["public"]["Tables"];
export type ApplicationsTable = Tables["applications"]["Row"];
export type InsertApplication = Tables["applications"]["Insert"];
export type UpdateApplication = Tables["applications"]["Update"];