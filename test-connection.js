// Test script to verify Supabase connection
// Run with: node test-connection.js

const { createClient } = require('@supabase/supabase-js');

// New project credentials
const supabaseUrl = 'https://bykxbhibrfgrdjnvtlaj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5a3hiaGlicmZncmRqbnZ0bGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTgzNzMsImV4cCI6MjA2NDI5NDM3M30.yNztFYgiqvSKnZpa_rnnmLDg8Lso6RU5mqBENxX26jM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  console.log('URL:', supabaseUrl);
  
  try {
    // Test basic connection
    console.log('\n📡 Testing basic connection...');
    const { data, error } = await supabase.from('devices').select('count').limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ Connection successful! (Table "devices" does not exist yet - this is expected)');
        console.log('📋 Error details:', error.message);
      } else {
        console.log('❌ Connection failed:', error.message);
        console.log('🔍 Error code:', error.code);
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('📊 Data:', data);
    }
    
    // Test auth connection
    console.log('\n🔐 Testing auth connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Auth connection failed:', authError.message);
    } else {
      console.log('✅ Auth connection successful!');
      console.log('📋 Session data:', authData);
    }
    
    // Test storage connection
    console.log('\n📦 Testing storage connection...');
    const { data: storageData, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.log('❌ Storage connection failed:', storageError.message);
    } else {
      console.log('✅ Storage connection successful!');
      console.log('📦 Available buckets:', storageData?.map(b => b.name) || []);
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

testConnection();
