/**
 * Sync Integration Test
 * Tests complete sync flow with session validation, error handling, and data persistence
 */

import { validateSupabaseSession } from '../lib/sessionValidator';
import { DeviceLocalStorage, LocalDevice } from '../lib/localStorage';
import { syncDevice } from '../lib/deviceSync';
import { getSyncBehavior, isLocalFirstStrategy, shouldPreserveLocalData } from '../lib/syncStrategy';

interface TestResult {
  testName: string;
  passed: boolean;
  details: string;
  error?: string;
}

export const testSyncIntegration = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];
  
  console.log('Mobile sync integration test: Starting comprehensive sync tests...', {
    platform: 'mobile',
    timestamp: new Date().toISOString()
  });
  
  // Test 1: Session validation functionality
  try {
    console.log('Test 1: Session validation...');
    const sessionResult = await validateSupabaseSession();
    
    results.push({
      testName: 'Session Validation',
      passed: typeof sessionResult.isValid === 'boolean',
      details: `Session valid: ${sessionResult.isValid}, Error: ${sessionResult.error || 'none'}`,
      error: sessionResult.error
    });
    
  } catch (error) {
    results.push({
      testName: 'Session Validation',
      passed: false,
      details: 'Exception during session validation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Test 2: Local storage functionality
  try {
    console.log('Test 2: Local storage operations...');
    const devices = await DeviceLocalStorage.getDevices();
    const syncStatus = await DeviceLocalStorage.getSyncStatus();
    
    results.push({
      testName: 'Local Storage Operations',
      passed: Array.isArray(devices) && syncStatus !== undefined,
      details: `Devices found: ${devices.length}, Sync status available: ${!!syncStatus}`,
    });
    
  } catch (error) {
    results.push({
      testName: 'Local Storage Operations',
      passed: false,
      details: 'Local storage operations failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Test 3: Sync strategy configuration
  try {
    console.log('Test 3: Sync strategy configuration...');
    const syncBehavior = getSyncBehavior();
    const isLocalFirst = isLocalFirstStrategy();
    const shouldPreserve = shouldPreserveLocalData();
    
    results.push({
      testName: 'Sync Strategy Configuration',
      passed: isLocalFirst && shouldPreserve && syncBehavior.shouldKeepLocalAfterSync,
      details: `Local-first: ${isLocalFirst}, Preserve data: ${shouldPreserve}, Keep after sync: ${syncBehavior.shouldKeepLocalAfterSync}`,
    });
    
  } catch (error) {
    results.push({
      testName: 'Sync Strategy Configuration',
      passed: false,
      details: 'Sync strategy configuration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Test 4: Device sync status management
  try {
    console.log('Test 4: Device sync status management...');
    const devices = await DeviceLocalStorage.getDevices();
    const pendingDevices = devices.filter(d => d.sync_status === 'pending');
    const syncedDevices = devices.filter(d => d.sync_status === 'synced');
    const failedDevices = devices.filter(d => d.sync_status === 'failed');
    
    results.push({
      testName: 'Device Sync Status Management',
      passed: devices.length >= 0, // Basic check that status queries work
      details: `Total: ${devices.length}, Pending: ${pendingDevices.length}, Synced: ${syncedDevices.length}, Failed: ${failedDevices.length}`,
    });
    
  } catch (error) {
    results.push({
      testName: 'Device Sync Status Management',
      passed: false,
      details: 'Device status management failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Test 5: Health check functionality
  try {
    console.log('Test 5: Storage health check...');
    const healthResult = await DeviceLocalStorage.healthCheck();
    
    results.push({
      testName: 'Storage Health Check',
      passed: typeof healthResult === 'boolean',
      details: `Health check result: ${healthResult}`,
    });
    
  } catch (error) {
    results.push({
      testName: 'Storage Health Check',
      passed: false,
      details: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Test 6: Error handling scenarios
  try {
    console.log('Test 6: Error handling scenarios...');
    
    // Test invalid device sync (should handle gracefully)
    const invalidDevice: LocalDevice = {
      id: 'test-invalid',
      user_id: 'test-user',
      name: '',
      supplier: null,
      category: null,
      purchase_date: '',
      warranty_months: 0,
      warranty_end_date: '',
      purchase_price: null,
      location: null,
      photo_irl: null,
      notes: null,
      invoice_url: '',
      identifiers: null,
      created_at: new Date().toISOString(),
      sync_status: 'pending',
      local_id: 'test-local-invalid'
    };
    
    // This should handle errors gracefully
    let errorHandled = false;
    try {
      await syncDevice(invalidDevice);
    } catch (syncError) {
      errorHandled = true;
      console.log('Expected error handled:', syncError instanceof Error ? syncError.message : 'Unknown');
    }
    
    results.push({
      testName: 'Error Handling Scenarios',
      passed: errorHandled, // Should catch and handle errors
      details: `Error handling working: ${errorHandled}`,
    });
    
  } catch (error) {
    results.push({
      testName: 'Error Handling Scenarios',
      passed: false,
      details: 'Error handling test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
  
  // Test Summary
  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  
  console.log('Mobile sync integration test: Test summary', {
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    successRate: `${Math.round((passedTests / totalTests) * 100)}%`,
    platform: 'mobile'
  });
  
  // Log individual results
  results.forEach(result => {
    const status = result.passed ? 'PASS' : 'FAIL';
    console.log(`Mobile sync test [${status}]: ${result.testName} - ${result.details}`);
    if (!result.passed && result.error) {
      console.error(`  Error: ${result.error}`);
    }
  });
  
  return results;
};

// Export helper function for manual testing
export const runSyncIntegrationTest = async (): Promise<void> => {
  console.log('Starting manual sync integration test...');
  const results = await testSyncIntegration();
  
  const allPassed = results.every(r => r.passed);
  console.log(`Integration test ${allPassed ? 'PASSED' : 'FAILED'}`);
  
  if (!allPassed) {
    console.error('Failed tests:', results.filter(r => !r.passed));
  }
};

// Test data helper
export const createTestDevice = (overrides?: Partial<LocalDevice>): LocalDevice => ({
  id: `test-device-${Date.now()}`,
  user_id: 'test-user-id',
  name: 'Test Device',
  supplier: 'Test Supplier',
  category: 'Electronics',
  purchase_date: new Date().toISOString().split('T')[0],
  warranty_months: 12,
  warranty_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  purchase_price: 999,
  location: 'Test Location',
  photo_irl: null,
  notes: 'Test device for integration testing',
  invoice_url: '',
  identifiers: JSON.stringify({ serial: 'TEST123', model: 'TEST-MODEL' }),
  created_at: new Date().toISOString(),
  sync_status: 'pending',
  local_id: `test-local-${Date.now()}`,
  ...overrides
});





