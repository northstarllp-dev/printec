import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey!);

async function main() {
  const { data, error } = await supabase.from('installations').select('*').limit(1);
  if (error) {
    console.error("Error querying installations:", error.message);
  } else {
    console.log("Installations table exists. Columns:", Object.keys(data[0] || {}));
  }
}

main();
