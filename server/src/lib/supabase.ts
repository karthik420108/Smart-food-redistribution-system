import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Find .env file by searching upwards from __dirname
let envPath = '';
let currentDir = __dirname;
while (currentDir !== path.parse(currentDir).root) {
  const checkPath = path.join(currentDir, '.env');
  if (fs.existsSync(checkPath)) {
    envPath = checkPath;
    break;
  }
  currentDir = path.dirname(currentDir);
}

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // Fallback to current working directory
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseServiceKey) {
  console.warn('Warning: No Supabase API key found in server environment!');
} else {
  const keyType = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE_KEY' : 'ANON_KEY';
  console.log(`Supabase initialized with ${keyType}`);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
