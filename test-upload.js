const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  env.split('\n')
    .filter(line => line.includes('='))
    .map(line => {
      const parts = line.split('=');
      const key = parts.shift();
      let value = parts.join('=');
      value = value.trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      return [key.trim(), value];
    })
);

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  const fileContent = 'test data';
  const { data, error } = await supabase.storage
    .from('site-visit-photos')
    .upload('test/test.txt', fileContent, { contentType: 'text/plain', upsert: true });

  if (error) {
    console.error('Upload Error:', error);
  } else {
    console.log('Upload Success:', data);
  }
}

testUpload();
