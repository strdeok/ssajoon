import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from("problems")
    .select("category, difficulty, is_hidden")
    .limit(20);
  
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(JSON.stringify(data, null, 2));
}

main();
