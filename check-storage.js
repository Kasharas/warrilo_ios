// Check storage buckets in new Supabase project
// Run with: node check-storage.js

const { createClient } = require('@supabase/supabase-js');

// New project credentials
const supabaseUrl = 'https://bykxbhibrfgrdjnvtlaj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5a3hiaGlicmZncmRqbnZ0bGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTgzNzMsImV4cCI6MjA2NDI5NDM3M30.yNztFYgiqvSKnZpa_rnnmLDg8Lso6RU5mqBENxX26jM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStorage() {
  console.log('🔍 Checking storage setup in new Supabase project...');
  console.log('URL:', supabaseUrl);
  
  try {
    // Check existing buckets
    console.log('\n📦 Checking existing storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.log('❌ Error listing buckets:', bucketsError.message);
      return;
    }
    
    if (buckets && buckets.length > 0) {
      console.log('✅ Found existing buckets:');
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
        console.log(`    Created: ${bucket.created_at}`);
        console.log(`    Updated: ${bucket.updated_at}`);
      });
    } else {
      console.log('📋 No storage buckets found - we need to create them');
    }
    
    // Check what buckets the app expects
    console.log('\n🎯 App expects these buckets:');
    console.log('  - device-photos (public) - for device images');
    console.log('  - device-invoices (public) - for receipts/invoices');
    
    // Check if we need to create buckets
    const expectedBuckets = ['device-photos', 'device-invoices'];
    const existingBucketNames = buckets?.map(b => b.name) || [];
    
    console.log('\n🔧 Bucket creation needed:');
    expectedBuckets.forEach(bucketName => {
      if (existingBucketNames.includes(bucketName)) {
        console.log(`  ✅ ${bucketName} - EXISTS`);
      } else {
        console.log(`  ❌ ${bucketName} - NEEDS TO BE CREATED`);
      }
    });
    
    // Check database tables for storage references
    console.log('\n🗄️ Checking database tables for storage references...');
    
    // Check devices table structure
    const { data: devicesData, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .limit(1);
    
    if (devicesError) {
      console.log('❌ Error checking devices table:', devicesError.message);
    } else {
      console.log('✅ Devices table accessible');
      if (devicesData && devicesData.length > 0) {
        console.log('📊 Sample device data structure:', Object.keys(devicesData[0]));
      } else {
        console.log('📊 Devices table is empty (expected for new project)');
      }
    }
    
    // Check device_photos table structure
    const { data: photosData, error: photosError } = await supabase
      .from('device_photos')
      .select('*')
      .limit(1);
    
    if (photosError) {
      console.log('❌ Error checking device_photos table:', photosError.message);
    } else {
      console.log('✅ Device_photos table accessible');
      if (photosData && photosData.length > 0) {
        console.log('📊 Sample photo data structure:', Object.keys(photosData[0]));
      } else {
        console.log('📊 Device_photos table is empty (expected for new project)');
      }
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

checkStorage();
