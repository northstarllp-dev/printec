const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = 'https://jekitmbnwwprbthqtaof.supabase.co';
  const supabaseKey = 'sb_publishable_-6LLS65MbgeojAp25xzM1w_0thdyjYC';
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Signing up installation@printoms.co.in...");
  const { data, error } = await supabase.auth.signUp({
    email: 'installation@printoms.co.in',
    password: 'installationpass',
  });

  if (error) {
    console.error("Auth error:", error.message);
  } else {
    console.log("User created:", data.user?.id);
    
    // Now wait a bit and update the user in public.users to have staff_role = 'Installation'
    console.log("Setting staff_role...");
    const { error: dbError } = await supabase
      .from('users')
      .update({ role: 'staff', staff_role: 'Installation', name: 'Installation Team' })
      .eq('id', data.user.id);
      
    if (dbError) {
       console.error("DB Update Error:", dbError.message);
    } else {
       console.log("Successfully set up installation@printoms.co.in!");
    }
  }
}

main();
