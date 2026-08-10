import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/config/env";

export const supabaseClient: SupabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey);
