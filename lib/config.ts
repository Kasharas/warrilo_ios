// Supabase Configuration
// Replace these with your actual Supabase project credentials
export const SUPABASE_CONFIG = {
  url: 'https://bykxbhibrfgrdjnvtlaj.supabase.co', // NEW PROJECT URL
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5a3hiaGlicmZncmRqbnZ0bGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTgzNzMsImV4cCI6MjA2NDI5NDM3M30.yNztFYgiqvSKnZpa_rnnmLDg8Lso6RU5mqBENxX26jM', // NEW ANON KEY
};

// To get these values:
// 1. Go to https://supabase.com
// 2. Create a new project or select existing one
// 3. Go to Settings > API
// 4. Copy the "Project URL" and "anon public" key
// 5. Replace the values above

// Add this validation function to your existing config.ts:

export const AUTH_CONFIG = {
  supabaseUrl: SUPABASE_CONFIG.url,
  supabaseAnonKey: SUPABASE_CONFIG.anonKey,
  // No Google Client ID needed - Supabase handles Google OAuth configuration
};

export const validateAuthConfiguration = () => {
  console.log('🔧 VALIDATING AUTH CONFIGURATION 🔧');
  
  const requiredEnvVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missing = [];
  const present = [];
  
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value === 'your-client-id-here' || value === 'your-anon-key-here') {
      missing.push(varName);
    } else {
      present.push(varName);
    }
  });
  
  console.log('✅ Environment variables present:', present);
  console.log('❌ Environment variables missing/invalid:', missing);
  
  if (missing.length > 0) {
    console.warn('⚠️ Some required environment variables are missing');
    console.warn('Please update your .env file with actual values');
  }
  
  return {
    isValid: missing.length === 0,
    missing,
    present
  };
};





















