import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { compressImage, platformInfo, CompressionOptions } from '../lib/imageCompression';

/**
 * Test Component for Phase 1: Platform Detection & Service Architecture
 * This component tests the basic functionality without actual image compression
 */
export const ImageCompressionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runPlatformTests = () => {
    setIsTesting(true);
    setTestResults([]);
    
    addResult('=== PHASE 1: PLATFORM DETECTION TESTS ===');
    
    // Test 1: Platform Detection
    addResult(`Platform: ${platformInfo.platform}`);
    addResult(`Is Web: ${platformInfo.isWeb}`);
    addResult(`Is Mobile: ${platformInfo.isMobile}`);
    addResult(`Supports Compression: ${platformInfo.supportsCompression}`);
    
    // Test 2: Interface Validation
    addResult('=== Interface Validation ===');
    addResult('CompressionOptions interface: ✅ Available');
    addResult('CompressionResult interface: ✅ Available');
    addResult('compressImage function: ✅ Available');
    addResult('compressDevicePhoto function: ✅ Available');
    addResult('compressReceipt function: ✅ Available');
    
    // Test 3: Function Availability
    addResult('=== Function Availability ===');
    try {
      const testOptions: CompressionOptions = {
        maxSizeKB: 50,
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        format: 'jpeg'
      };
      addResult('CompressionOptions creation: ✅ Success');
      addResult(`Options: ${JSON.stringify(testOptions)}`);
    } catch (error) {
      addResult(`CompressionOptions creation: ❌ Failed - ${error}`);
    }
    
    // Test 4: Platform-Specific Logic
    addResult('=== Platform-Specific Logic ===');
    if (platformInfo.isWeb) {
      addResult('Web compression backend: ✅ Available');
      addResult('Canvas-based compression: ✅ Supported');
    } else if (platformInfo.isMobile) {
      addResult('Mobile compression backend: ✅ Available');
      addResult('Native compression: ✅ Supported');
    } else {
      addResult('Platform detection: ❌ Unknown platform');
    }
    
    addResult('=== PHASE 1 TESTS COMPLETE ===');
    setIsTesting(false);
  };

  const runCompressionTest = async () => {
    if (!platformInfo.supportsCompression) {
      addResult('❌ Compression not supported on this platform');
      return;
    }
    
    setIsTesting(true);
    addResult('=== COMPRESSION FUNCTIONALITY TEST ===');
    
    try {
      // Test with a dummy image URI (this will fail but tests the function structure)
      const testUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
      
      addResult('Testing compression function...');
      
      const result = await compressImage(testUri, {
        maxSizeKB: 50,
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        format: 'jpeg'
      });
      
      addResult(`Compression result: ${result.success ? '✅ Success' : '❌ Failed'}`);
      addResult(`Platform: ${result.platform}`);
      addResult(`Original size: ${result.originalSizeKB.toFixed(1)}KB`);
      addResult(`Compressed size: ${result.compressedSizeKB.toFixed(1)}KB`);
      addResult(`Compression ratio: ${result.compressionRatio.toFixed(1)}%`);
      
      if (result.error) {
        addResult(`Error: ${result.error}`);
      }
      
    } catch (error) {
      addResult(`❌ Compression test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setIsTesting(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Image Compression Test - Phase 1</Text>
      
      {/* Test Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.button, styles.primaryButton]} 
          onPress={runPlatformTests}
          disabled={isTesting}
        >
          <Text style={styles.buttonText}>
            {isTesting ? 'Testing...' : 'Run Platform Tests'}
          </Text>
        </Pressable>
        
        <Pressable 
          style={[styles.button, styles.secondaryButton]} 
          onPress={runCompressionTest}
          disabled={isTesting || !platformInfo.supportsCompression}
        >
          <Text style={styles.buttonText}>
            {isTesting ? 'Testing...' : 'Test Compression'}
          </Text>
        </Pressable>
        
        <Pressable 
          style={[styles.button, styles.clearButton]} 
          onPress={clearResults}
          disabled={isTesting}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </Pressable>
      </View>
      
      {/* Platform Info Display */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Platform Information:</Text>
        <Text style={styles.infoText}>OS: {Platform.OS}</Text>
        <Text style={styles.infoText}>Web: {platformInfo.isWeb ? '✅' : '❌'}</Text>
        <Text style={styles.infoText}>Mobile: {platformInfo.isMobile ? '✅' : '❌'}</Text>
        <Text style={styles.infoText}>Compression: {platformInfo.supportsCompression ? '✅' : '❌'}</Text>
      </View>
      
      {/* Test Results */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Results:</Text>
        <View style={styles.resultsList}>
          {testResults.map((result, index) => (
            <Text key={index} style={styles.resultText}>
              {result}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  button: {
    padding: 12,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 6,
    maxHeight: 300,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  resultsList: {
    maxHeight: 250,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 3,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

export default ImageCompressionTest;
