const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFileContent = fs.readFileSync('./.env.local', 'utf8');
const env = {};
envFileContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // Using the publishable key

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase key length:", supabaseKey ? supabaseKey.length : 0);
console.log("Supabase key value:", supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  const email = 'admin@printec.com';
  const password = 'adminpass';
  
  console.log(`Testing login for ${email}...`);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error("Login Failed:", error.message);
  } else {
    console.log("Login Successful!");
  }
}

testLogin();
