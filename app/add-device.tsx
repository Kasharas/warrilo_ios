import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView, ActivityIndicator, Switch, Image, Modal, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { useDeviceSync } from '@/src/hooks/useDeviceSync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMonths, parseISO, isValid } from 'date-fns';
import { useDeviceUpload } from '@/src/hooks/useDeviceUpload';
import { AddDeviceFormData, DeviceFileData } from '@/src/types/device';
import { requestImagePermissions } from '@/src/utils/permissions';

// Safe date parsing function (same as in warrantyAlertUtils.ts)
const parseDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  const isoDate = parseISO(dateString);
  if (isValid(isoDate)) return isoDate;
  
  const fallbackDate = new Date(dateString);
  return isValid(fallbackDate) ? fallbackDate : new Date();
};

export default function AddDeviceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addDevice, isStoring } = useDeviceSync();
  const { isUploading, uploadDevice } = useDeviceUpload(user?.id || '');
  
  // Get the previous route from navigation state
  const getPreviousRoute = () => {
    // Try to get the previous route from the navigation state
    if (router.canGoBack()) {
      return 'back';
    }
    // If no previous route, default to devices
    return 'devices';
  };
  
  // Form state
  const [deviceName, setDeviceName] = useState('');
  const [brand, setBrand] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [category, setCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [storeName, setStoreName] = useState('');
  const [warrantyDuration, setWarrantyDuration] = useState('');
  const [warrantyExpiryDate, setWarrantyExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  
  // Image state
  const [deviceImage, setDeviceImage] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [deviceImageCompressing, setDeviceImageCompressing] = useState(false);
  const [receiptImageCompressing, setReceiptImageCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Feature toggles
  const [autoReceiptExtraction, setAutoReceiptExtraction] = useState(false);
  
  // Loading state - now managed by our own state
  
  // Compression status state
  const [compressionStatus, setCompressionStatus] = useState('');

  // UI state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showWarrantyDropdown, setShowWarrantyDropdown] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tempSelectedCategory, setTempSelectedCategory] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  
  // Refs for scrolling to current date
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);
  
  // Track if user has manually scrolled or selected a date (to prevent auto-alignment)
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const [hasUserSelectedDate, setHasUserSelectedDate] = useState(false);

  const handleBackPress = () => {
    console.log('Back button pressed - function called');
    const route = getPreviousRoute();
    if (route === 'back') {
      console.log('Going back to previous screen');
      router.back();
    } else {
      console.log('No previous screen, going to devices');
      router.push('/devices');
    }
  };

  const pickImage = async (type: 'device' | 'receipt') => {
    // This function is kept for backward compatibility but now just calls library
    await pickImageFromLibrary(type);
  };

  const pickImageFromCamera = async (type: 'device' | 'receipt') => {
    try {
      console.log('📸 Starting camera for:', type);
      
      // Request image permissions
      const hasPermissions = await requestImagePermissions();
      if (!hasPermissions) {
        return;
      }
      
      // Always use camera directly - no emulator workaround needed
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Correct API
        allowsEditing: false, // No cropping - use full image
        quality: 0.8, // Higher quality like library picker
        exif: false,
        base64: false,
      });

      console.log('📸 Camera result:', {
        canceled: result.canceled,
        assets: result.assets ? result.assets.length : 0,
        hasAssets: !!result.assets
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('📸 Camera asset captured:', {
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height
        });
        
        // Use handleImageSelection to compress the image
        if (asset.uri) {
          await handleImageSelection(asset, type);
        } else {
          console.error('❌ No URI found in captured asset');
          Alert.alert('Error', 'Failed to capture image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in pickImageFromCamera:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const pickImageFromLibrary = async (type: 'device' | 'receipt') => {
    try {
      console.log('🖼️ Starting library picker for:', type);
      
      // Request image permissions
      const hasPermissions = await requestImagePermissions();
      if (!hasPermissions) {
        return;
      }
      
      await launchImageLibrary(type);
    } catch (error) {
      console.error('Error in pickImageFromLibrary:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const launchCamera = async (type: 'device' | 'receipt') => {
    try {
      // Use the most basic configuration possible to avoid type deduction issues
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Correct API
        allowsEditing: true, // Forces consistent format processing
        aspect: [1, 1], // Helps Android understand it's an image
        quality: 0.5, // Very low quality to minimize processing
        exif: false,
        base64: false,
      });

      console.log('📸 Camera result:', {
        canceled: result.canceled,
        assets: result.assets ? result.assets.length : 0,
        hasAssets: !!result.assets
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('📸 Camera asset captured:', {
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height
        });
        
        // Set the image directly without validation to avoid type deduction
        if (asset.uri) {
          if (type === 'device') {
            setDeviceImage(asset.uri);
            console.log('✅ Device image set successfully');
          } else {
            setReceiptImage(asset.uri);
            console.log('✅ Receipt image set successfully');
          }
        } else {
          console.error('❌ No URI found in captured asset');
          Alert.alert('Error', 'Failed to capture image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error launching camera:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const launchImageLibrary = async (type: 'device' | 'receipt') => {
    try {
      console.log('📱 Opening image library...');
      
      // Try to open image library first - no emulator workaround
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Correct API
        allowsEditing: false, // Allow full image without cropping
        quality: 0.8, // Higher quality since we'll compress later
        exif: false,
        base64: false,
        allowsMultipleSelection: false,
      });

      console.log('📸 ImagePicker result:', {
        canceled: result.canceled,
        assets: result.assets ? result.assets.length : 0,
        hasAssets: !!result.assets
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('📸 Library asset selected:', {
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          width: asset.width,
          height: asset.height
        });
        
        // Use handleImageSelection to compress the image
        if (asset.uri) {
          await handleImageSelection(asset, type);
        } else {
          console.error('❌ No URI found in selected asset');
          Alert.alert('Error', 'No image data found. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error launching image library:', error);
      
      // Check if this is an emulator and offer camera fallback
      const isEmulator = !Constants.isDevice;
      if (isEmulator && Platform.OS === 'android') {
        console.log('📱 Library picker failed in emulator, offering camera fallback...');
        Alert.alert(
          'Library Unavailable',
          'Image library is not working in emulator. Would you like to use camera instead?',
          [
            {
              text: 'Use Camera',
              onPress: () => launchCamera(type),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to open photo library. Please try again.');
      }
    }
  };

  const handleImageSelection = async (selectedAsset: any, type: 'device' | 'receipt') => {
    try {
      console.log('📸 Image selected:', {
        uri: selectedAsset.uri,
        type: selectedAsset.type,
        fileName: selectedAsset.fileName,
        fileSize: selectedAsset.fileSize,
        width: selectedAsset.width,
        height: selectedAsset.height
      });
      
      // Validate the URI before setting it
      if (selectedAsset.uri) {
        // Quick validation to ensure it's not HTML
        if (selectedAsset.uri.includes('<!DOCTYPE html>') || selectedAsset.uri.includes('<html')) {
          console.error('❌ Selected image contains HTML content - this is invalid');
          Alert.alert('Error', 'Invalid image selected. Please try again.');
          return;
        }
        
        // Show original image immediately for instant preview
        console.log(`⚡ Showing original ${type} image immediately for instant preview`);
        if (type === 'device') {
          setDeviceImage(selectedAsset.uri);
          setDeviceImageCompressing(true);
          console.log('🔍 Device image set to original URI for instant preview:', selectedAsset.uri);
        } else {
          setReceiptImage(selectedAsset.uri);
          setReceiptImageCompressing(true);
          console.log('🔍 Receipt image set to original URI for instant preview:', selectedAsset.uri);
        }
        
        // Start background compression
        console.log(`🔄 Starting background compression for ${type} image...`);
        compressImageInBackground(selectedAsset, type);
      } else {
        console.error('❌ No URI found in selected asset');
        Alert.alert('Error', 'No image data found. Please try again.');
      }
    } catch (error) {
      console.error('Error handling image selection:', error);
      Alert.alert('Error', 'Failed to process selected image. Please try again.');
    }
  };

  const compressImageInBackground = async (selectedAsset: any, type: 'device' | 'receipt') => {
    try {
      const { compressDevicePhoto, compressReceipt } = await import('@/src/lib/imageCompression');
      
      let compressedUri: string;
      if (type === 'device') {
        const result = await compressDevicePhoto(selectedAsset.uri, selectedAsset);
        compressedUri = result.compressedUri;
        console.log(`✅ Device photo compressed in background: ${result.originalSizeKB}KB → ${result.compressedSizeKB}KB`);
        
        // Update to compressed image
        setDeviceImage(compressedUri);
        setDeviceImageCompressing(false);
        console.log('🔍 Device image updated to compressed URI:', compressedUri);
      } else {
        const result = await compressReceipt(selectedAsset.uri, selectedAsset);
        compressedUri = result.compressedUri;
        console.log(`✅ Receipt photo compressed in background: ${result.originalSizeKB}KB → ${result.compressedSizeKB}KB`);
        
        // Update to compressed image
        setReceiptImage(compressedUri);
        setReceiptImageCompressing(false);
        console.log('🔍 Receipt image updated to compressed URI:', compressedUri);
      }
      
      console.log('✅ Background compression completed for', type);
    } catch (error) {
      console.error('❌ Background compression failed:', error);
      // Keep the original image if compression fails
      if (type === 'device') {
        setDeviceImageCompressing(false);
      } else {
        setReceiptImageCompressing(false);
      }
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called');
    console.log('Form values:', {
      deviceName: deviceName.trim(),
      selectedDate,
      warrantyDuration,
      receiptImage,
      deviceImage,
      serialNumber: serialNumber.trim(),
      storeName: storeName.trim()
    });

    if (!deviceName.trim()) {
      console.log('Validation failed: Item name is empty');
      Alert.alert('Error', 'Item name is required');
      return;
    }

    if (!selectedDate) {
      console.log('Validation failed: Purchase date is not selected');
      Alert.alert('Error', 'Purchase date is required');
      return;
    }

    if (!warrantyDuration) {
      console.log('Validation failed: Warranty duration is empty');
      Alert.alert('Error', 'Warranty duration is required');
      return;
    }

    // Start loading overlay
    setIsSubmitting(true);

    if (!receiptImage) {
      console.log('Validation failed: Receipt image is not selected');
      Alert.alert('Error', 'Receipt is required');
      return;
    }

    console.log('All validations passed, proceeding with submission...');

    try {
      setCompressionStatus('Preparing images...');
      
      // Prepare form data for sync system
      const formData = {
        name: deviceName.trim(),
        purchaseDate: selectedDate,
        warrantyMonths: warrantyDuration,
        purchasePrice: purchasePrice.trim(),
        receipt: { uri: receiptImage, type: 'library' as const },
        serialNumber: serialNumber.trim(),
        storeName: storeName.trim(),
        category: selectedCategory || '', // Add category field
        devicePhoto: { uri: deviceImage, type: 'library' as const },
      };

      console.log('Submitting form data:', formData);

      // Use the sync system to add device
      const result = await addDevice(formData);
      
      console.log('Add device result:', result);
      
      if (result.success) {
        console.log('Device stored locally with ID:', result.localId);
        console.log('Navigation: About to navigate to dashboard');
        setCompressionStatus('Device saved!');
        
        // Show success message briefly, then navigate
        setTimeout(() => {
          console.log('Navigation: Auto-navigating to dashboard after delay');
          try {
            // Navigate with refresh parameter to trigger dashboard refresh
            router.push({
              pathname: '/',
              params: { refresh: 'true', timestamp: Date.now().toString() }
            });
            console.log('Navigation: router.push(/) with refresh params called successfully');
          } catch (navError) {
            console.error('Navigation error:', navError);
            // Fallback navigation
            try {
              router.replace({
                pathname: '/',
                params: { refresh: 'true', timestamp: Date.now().toString() }
              });
              console.log('Navigation: router.replace(/) with refresh params called as fallback');
            } catch (replaceError) {
              console.error('Replace navigation error:', replaceError);
            }
          }
        }, 1000); // 1 second delay
        
        Alert.alert(
          'Success!',
          result.message,
          [
            {
              text: 'OK',
              onPress: () => {
                console.log('Navigation: OK button pressed, navigating to dashboard');
                try {
                  // Navigate with refresh parameter to trigger dashboard refresh
                  router.push({
                    pathname: '/',
                    params: { refresh: 'true', timestamp: Date.now().toString() }
                  });
                  console.log('Navigation: OK button router.push(/) with refresh params called successfully');
                } catch (navError) {
                  console.error('OK button navigation error:', navError);
                  // Fallback navigation
                  try {
                    router.replace({
                      pathname: '/',
                      params: { refresh: 'true', timestamp: Date.now().toString() }
                    });
                    console.log('Navigation: OK button router.replace(/) with refresh params called successfully');
                  } catch (replaceError) {
                    console.error('OK button replace navigation error:', replaceError);
                  }
                }
              }
            }
          ]
        );
      } else {
        console.error('Add device failed:', result.message);
        setCompressionStatus('');
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error adding device:', error);
      setCompressionStatus('');
      
      // Handle specific error types
      let errorMessage = 'Failed to add item. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('quota')) {
          errorMessage = 'Storage is full. Please try again or contact support.';
        } else if (error.message.includes('Failed to store device locally')) {
          errorMessage = 'Unable to save item locally. Please try again.';
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  // New upload handler using the upload service with immediate local storage
  const handleSaveDevice = async () => {
    console.log('=== ADD DEVICE BUTTON PRESSED ===');
    console.log('User ID:', user?.id);
    
    if (!user?.id) {
      console.log('ERROR: No user ID found');
      Alert.alert('Error', 'You must be logged in to add a device');
      return;
    }
    
    // Start loading overlay
    setIsSubmitting(true);
    
    try {
      // Validate required fields before proceeding
      if (!deviceName.trim()) {
        Alert.alert('Error', 'Item name is required');
        return;
      }
      
      if (!selectedDate) {
        Alert.alert('Error', 'Purchase date is required');
        return;
      }
      
      if (!warrantyDuration) {
        Alert.alert('Error', 'Warranty duration is empty');
        return;
      }
      
      if (!receiptImage) {
        Alert.alert('Error', 'Receipt is required');
        return;
      }
    
      console.log('Validation passed, starting image compression...');
      // Step 1: Compress images BEFORE storing locally
      let compressedDevicePhoto = null;
      let compressedReceipt = null;
      
      // Import compression and validation functions
      const { compressDevicePhoto, compressReceipt } = await import('@/src/lib/imageCompression');
      const { validateImageUri, isObviouslyInvalidUri } = await import('@/src/utils/validateImageUri');
      
      // Validate and compress device photo if exists
      if (deviceImage) {
        console.log('🔍 Validating device photo URI...');
        setCompressionStatus('Validating device photo...');
        
        // Quick check for obviously invalid URIs
        if (isObviouslyInvalidUri(deviceImage)) {
          console.error('❌ Device photo URI is obviously invalid:', deviceImage);
          setCompressionStatus('Device photo URI is invalid - please select a new image');
          Alert.alert('Invalid Image', 'The selected device photo is invalid. Please select a new image.');
          return;
        }
        
        // Detailed validation
        const validationResult = await validateImageUri(deviceImage);
        if (!validationResult.isValid) {
          console.error('❌ Device photo validation failed:', validationResult.error);
          setCompressionStatus('Device photo validation failed: ' + validationResult.error);
          Alert.alert('Invalid Image', `Device photo validation failed: ${validationResult.error}`);
          return;
        }
        
        console.log('✅ Device photo URI validated:', {
          mimeType: validationResult.mimeType,
          size: validationResult.size ? `${(validationResult.size / 1024).toFixed(1)}KB` : 'unknown'
        });
        
        console.log('🖼️ Compressing device photo...');
        setCompressionStatus('Compressing device photo...');
        
        try {
          const compressionResult = await compressDevicePhoto(deviceImage);
          if (compressionResult.success) {
            compressedDevicePhoto = compressionResult.compressedUri;
            console.log(`✅ Device photo compressed: ${compressionResult.originalSizeKB.toFixed(1)}KB → ${compressionResult.compressedSizeKB.toFixed(1)}KB (${compressionResult.compressionRatio.toFixed(1)}% reduction)`);
            setCompressionStatus(`Device photo compressed: ${compressionResult.compressionRatio.toFixed(1)}% reduction`);
          } else {
            console.warn('⚠️ Device photo compression failed, using original:', compressionResult.error);
            compressedDevicePhoto = deviceImage; // Fallback to original
            setCompressionStatus('Device photo compression failed, using original');
          }
        } catch (error) {
          console.error('❌ Device photo compression error:', error);
          compressedDevicePhoto = deviceImage; // Fallback to original
          setCompressionStatus('Device photo compression error, using original');
        }
      }
      
      // Validate and compress receipt if exists
      if (receiptImage) {
        console.log('🔍 Validating receipt URI...');
        setCompressionStatus('Validating receipt...');
        
        // Quick check for obviously invalid URIs
        if (isObviouslyInvalidUri(receiptImage)) {
          console.error('❌ Receipt URI is obviously invalid:', receiptImage);
          setCompressionStatus('Receipt URI is invalid - please select a new image');
          Alert.alert('Invalid Image', 'The selected receipt is invalid. Please select a new image.');
          return;
        }
        
        // Detailed validation
        const validationResult = await validateImageUri(receiptImage);
        if (!validationResult.isValid) {
          console.error('❌ Receipt validation failed:', validationResult.error);
          setCompressionStatus('Receipt validation failed: ' + validationResult.error);
          Alert.alert('Invalid Image', `Receipt validation failed: ${validationResult.error}`);
          return;
        }
        
        console.log('✅ Receipt URI validated:', {
          mimeType: validationResult.mimeType,
          size: validationResult.size ? `${(validationResult.size / 1024).toFixed(1)}KB` : 'unknown'
        });
        
        console.log('🧾 Compressing receipt...');
        setCompressionStatus('Compressing receipt...');
        
        try {
          const compressionResult = await compressReceipt(receiptImage);
          if (compressionResult.success) {
            compressedReceipt = compressionResult.compressedUri;
            console.log(`✅ Receipt compressed: ${compressionResult.originalSizeKB.toFixed(1)}KB → ${compressionResult.compressedSizeKB.toFixed(1)}KB (${compressionResult.compressionRatio.toFixed(1)}% reduction)`);
            setCompressionStatus(`Receipt compressed: ${compressionResult.compressionRatio.toFixed(1)}% reduction`);
          } else {
            console.warn('⚠️ Receipt compression failed, using original:', compressionResult.error);
            compressedReceipt = receiptImage; // Fallback to original
            setCompressionStatus('Receipt compression failed, using original');
          }
        } catch (error) {
          console.error('❌ Receipt compression error:', error);
          compressedReceipt = receiptImage; // Fallback to original
          setCompressionStatus('Receipt compression error, using original');
        }
      }
      
      console.log('✅ Image compression completed, storing device locally...');
      setCompressionStatus('Storing device locally...');
      
      // Step 2: Store device locally with COMPRESSED images
      const localDeviceData = {
        id: '', // Will be updated with Supabase ID after upload
        user_id: user.id,
        name: deviceName.trim(),
        supplier: storeName.trim(),
        category: selectedCategory || '',
        purchase_date: selectedDate.toISOString().split('T')[0],
        warranty_months: parseInt(warrantyDuration),
        warranty_end_date: addMonths(parseDate(selectedDate.toISOString().split('T')[0]), parseInt(warrantyDuration)).toISOString().split('T')[0],
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        location: null,
        photo_irl: compressedDevicePhoto, // Store COMPRESSED image
        notes: notes || null,
        invoice_url: compressedReceipt, // Store COMPRESSED receipt
        identifiers: serialNumber.trim() || null,
        created_at: new Date().toISOString(),
        sync_status: 'pending' as const,
        local_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      console.log('Storing device locally with COMPRESSED images:', localDeviceData);
      
      // Import and use DeviceLocalStorage to store immediately
      const { DeviceLocalStorage } = await import('@/src/lib/localStorage');
      await DeviceLocalStorage.storeDevice(localDeviceData);
      
      console.log('✅ Device stored locally successfully with compressed images');
      setCompressionStatus('Device stored locally successfully!');
      
      // Step 3: Navigate to dashboard with refresh parameter
      console.log('Navigating to dashboard with refresh parameter...');
      router.push({
        pathname: '/',
        params: { refresh: 'true', timestamp: Date.now().toString() }
      });
      
      // Step 4: Continue with background upload
      console.log('Starting background device upload process...');
      
      // Prepare form data for background upload
      const formData: AddDeviceFormData = {
        deviceName: deviceName || '',
        brand: brand || '',
        serialNumber: serialNumber || '',
        category: selectedCategory || '',
        purchaseDate: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
        store: storeName || '',
        warrantyMonths: warrantyDuration ? parseInt(warrantyDuration) : 0,
        notes: notes || undefined,
        localDeviceId: localDeviceData.local_id, // Pass local device ID for alert linking
      };
      
      console.log('Form data prepared for background upload:', formData);

      // Prepare file data for background upload (using COMPRESSED images for Supabase)
      const fileData: DeviceFileData = {
        devicePhoto: compressedDevicePhoto ? {
          uri: compressedDevicePhoto, // Use compressed image for Supabase upload
          name: 'device-photo.jpg',
          type: 'image/jpeg'
      } : undefined,
        receiptPhoto: compressedReceipt ? {
          uri: compressedReceipt, // Use compressed image for Supabase upload
          name: 'receipt-photo.jpg',
          type: 'image/jpeg'
        } : undefined,
        additionalPhotos: undefined,
      };
      
      console.log('File data prepared for background upload (compressed images for Supabase):', fileData);

      // Upload the device in background (no await)
      uploadDevice(formData, fileData).then(result => {
        console.log('Background upload result:', result);
        if (result.success) {
          console.log('✅ Background upload completed successfully');
          setCompressionStatus('Upload completed successfully!');
          // Could show a success toast notification here
        } else {
          console.log('❌ Background upload failed:', result.error);
          setCompressionStatus('Upload failed: ' + result.error);
          // Could show an error toast notification here
        }
      }).catch(error => {
        console.error('Background upload error:', error);
        setCompressionStatus('Upload error: ' + error.message);
        // Could show an error toast notification here
      });
      
    } catch (error) {
      console.error('Error in device save process:', error);
      setCompressionStatus('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      Alert.alert('Error', 'Failed to save item. Please try again.');
    } finally {
      // Stop loading overlay
      setIsSubmitting(false);
    }
  };

           // Calculate warranty expiry date when purchase date or warranty duration changes
    useEffect(() => {
      if (selectedDate && warrantyDuration) {
        const purchase = new Date(selectedDate);
        const duration = parseInt(warrantyDuration);
        
        if (!isNaN(duration)) {
          const expiryDate = addMonths(purchase, duration);
          setWarrantyExpiryDate(expiryDate.toISOString().split('T')[0]);
        } else {
          setWarrantyExpiryDate('');
        }
      } else {
        setWarrantyExpiryDate('');
      }
    }, [selectedDate, warrantyDuration]);

  // Calculate scroll position to align all selections on same line
  const getScrollPosition = (selectedIndex, targetY = 0) => {
    // All columns scroll so their selected item appears at the same targetY position
    return Math.max(0, (selectedIndex * 44) - targetY);
  };

  // Auto-scroll all columns when date picker first opens (only if user hasn't scrolled or selected a date)
  useEffect(() => {
    if (showDatePicker && monthScrollRef.current && dayScrollRef.current && yearScrollRef.current && !hasUserScrolled && !hasUserSelectedDate) {
      const monthIndex = tempDate.getMonth();
      const dayIndex = tempDate.getDate() - 1; // Day is 1-based
      const yearIndex = years.findIndex(year => year === tempDate.getFullYear());
      
      const monthTargetY = 35; // Month column target Y position
      const dayTargetY = 0;    // Day column target Y position  
      const yearTargetY = 0;   // Year column target Y position
      
      setTimeout(() => {
        monthScrollRef.current?.scrollTo({ 
          y: getScrollPosition(monthIndex, monthTargetY), 
          animated: false 
        });
        dayScrollRef.current?.scrollTo({ 
          y: getScrollPosition(dayIndex, dayTargetY), 
          animated: false 
        });
        yearScrollRef.current?.scrollTo({ 
          y: getScrollPosition(yearIndex, yearTargetY), 
          animated: false 
        });
      }, 100);
    }
  }, [showDatePicker, tempDate, hasUserScrolled]);

  const categories = [
    'Electronics',
    'Cloth',
    'Automotive',
    'Other'
  ];

  // Generate date options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const days = Array.from({length: 31}, (_, i) => i + 1);
  const years = Array.from({length: 50}, (_, i) => new Date().getFullYear() - 25 + i);

  const warrantyDurations = [
    '1 Month',
    '3 Months',
    '6 Months',
    '1 Year',
    '2 Years',
    '3 Years',
    '5 Years',
    'Lifetime'
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
                 <Pressable 
                   onPress={() => {
                     console.log('Back button pressed - checking navigation state');
                     const route = getPreviousRoute();
                     if (route === 'back') {
                       console.log('Going back to previous screen');
                       router.back();
                     } else {
                       console.log('No previous screen, going to devices');
                       router.push('/devices');
                     }
                   }} 
                   style={styles.backButton}
                   hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                 >
                   <Ionicons name="arrow-back" size={20} color={theme.colors.neutral[600]} />
                 </Pressable>
        <Text style={styles.headerTitle}>Add Item</Text>
        <View style={styles.headerActions} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        

        
        {/* Compression Status */}
        {compressionStatus && (
          <View style={styles.compressionStatus}>
            <ActivityIndicator size="small" color={theme.colors.systemBlue} />
            <Text style={styles.compressionStatusText}>{compressionStatus}</Text>
          </View>
        )}
        
        {/* Item Photo Section */}
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Item Photo</Text>
                       {deviceImage ? (
              <View style={styles.imagePreviewContainer}>
                <View style={styles.imageWrapper}>
                  {console.log('🖼️ Rendering device image with URI:', deviceImage)}
                  <Image source={{ uri: deviceImage }} style={styles.imagePreview} />
                  {deviceImageCompressing && (
                    <View style={styles.compressionOverlay}>
                      <ActivityIndicator size="small" color={theme.colors.white} />
                      <Text style={styles.compressionText}>Compressing...</Text>
                    </View>
                  )}
                  <Pressable 
                    style={styles.removeImageButton} 
                    onPress={() => {
                      setDeviceImage(null);
                      setDeviceImageCompressing(false);
                    }}
                  >
                    <Text style={styles.removeImageButtonText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
             <View style={styles.uploadRow}>
               <Pressable style={styles.uploadZone} onPress={() => pickImageFromCamera('device')}>
                 <View style={styles.uploadContent}>
                   <Ionicons name="camera" size={32} color={theme.colors.neutral[400]} />
                   <Text style={styles.uploadText}>Take a photo</Text>
                 </View>
               </Pressable>
               <Pressable style={styles.uploadZone} onPress={() => pickImageFromLibrary('device')}>
                 <View style={styles.uploadContent}>
                   <Ionicons name="folder-open" size={32} color={theme.colors.neutral[400]} />
                   <Text style={styles.uploadText}>Choose from library</Text>
                 </View>
               </Pressable>
             </View>
           )}
         </View>

                          {/* Add Receipt Section */}
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Add Receipt</Text>
                       {receiptImage ? (
              <View style={styles.imagePreviewContainer}>
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: receiptImage }} style={styles.imagePreview} />
                  {receiptImageCompressing && (
                    <View style={styles.compressionOverlay}>
                      <ActivityIndicator size="small" color={theme.colors.white} />
                      <Text style={styles.compressionText}>Compressing...</Text>
                    </View>
                  )}
                  <Pressable 
                    style={styles.removeImageButton} 
                    onPress={() => {
                      setReceiptImage(null);
                      setReceiptImageCompressing(false);
                    }}
                  >
                    <Text style={styles.removeImageButtonText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
             <View style={styles.uploadRow}>
                               <Pressable style={styles.uploadZone} onPress={() => pickImageFromCamera('receipt')}>
                  <View style={styles.uploadContent}>
                    <Ionicons name="camera" size={32} color={theme.colors.neutral[400]} />
                    <Text style={styles.uploadText}>Take a photo</Text>
                  </View>
                </Pressable>
                <Pressable style={styles.uploadZone} onPress={() => pickImageFromLibrary('receipt')}>
                  <View style={styles.uploadContent}>
                    <Ionicons name="folder-open" size={32} color={theme.colors.neutral[400]} />
                    <Text style={styles.uploadText}>Add from library</Text>
                  </View>
                </Pressable>
              </View>
            )}
          
          {/* PRO Feature Toggle */}
          <View style={styles.proFeatureRow}>
            <View style={styles.proFeatureInfo}>
              <Ionicons name="bulb" size={20} color={theme.colors.warning[500]} />
              <Text style={styles.proFeatureText}>Auto receipt extraction</Text>
            </View>
            <Text style={styles.proBadge}>PRO</Text>
                         <Switch
               value={autoReceiptExtraction}
               onValueChange={(value) => {
                 if (value) {
                   // If turning on auto receipt extraction, navigate to plan selection
                   router.push('/plan-selection');
                 } else {
                   // If turning off, just update the state
                   setAutoReceiptExtraction(value);
                 }
               }}
               trackColor={{ false: theme.colors.neutral[200], true: theme.colors.neutral[200] }}
               thumbColor={autoReceiptExtraction ? theme.colors.systemGreen : theme.colors.systemRed}
               ios_backgroundColor={theme.colors.neutral[200]}
             />
          </View>
        </View>

        {/* Item Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Information</Text>
          
          <View style={styles.inputGroup}>
                         <TextInput
               style={styles.textInput}
               value={deviceName}
               onChangeText={setDeviceName}
               placeholder="Enter item name"
               placeholderTextColor={theme.colors.placeholderText}
             />
          </View>

                     <View style={styles.inputGroup}>
                          <TextInput
                style={styles.textInput}
                value={brand}
                onChangeText={setBrand}
                placeholder="Enter brand name"
                placeholderTextColor={theme.colors.placeholderText}
              />
           </View>

                      <View style={styles.inputGroup}>
                         <TextInput
               style={styles.textInput}
               value={serialNumber}
               onChangeText={setSerialNumber}
               placeholder="Enter serial number"
               placeholderTextColor={theme.colors.placeholderText}
             />
          </View>

                     <View style={styles.inputGroup}>
             <Pressable 
               style={styles.categoryButton}
               onPress={() => {
                 setTempSelectedCategory(selectedCategory); // Initialize with current selection
                 setShowCategoryPicker(true);
               }}
             >
               <Text style={[
                 styles.categoryButtonText,
                 !selectedCategory && styles.categoryPlaceholder
               ]}>
                 {selectedCategory || 'Choose category'}
               </Text>
               <Ionicons name="chevron-down" size={20} color={"#999"} />
             </Pressable>
           </View>
        </View>

        {/* Purchase Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Details</Text>
          
                     <View style={styles.inputGroup}>
                           <Pressable 
                style={styles.dateButton}
                                 onPress={() => {
                   setTempDate(selectedDate || new Date()); // Use current date if none selected
                   setShowDatePicker(true);
                   setHasUserScrolled(false); // Reset user scroll flag when opening
                   setHasUserSelectedDate(false); // Reset user selection flag when opening
                 }}
              >
               <Text style={[
                 styles.dateButtonText,
                 !selectedDate && styles.datePlaceholder
               ]}>
                 {selectedDate ? selectedDate.toLocaleDateString('en-US', {
                   month: 'long',
                   day: 'numeric', 
                   year: 'numeric'
                 }) : 'Purchase date'}
               </Text>
               <Ionicons name="calendar" size={20} color={"#999"} />
             </Pressable>
           </View>

          <View style={styles.inputGroup}>
                         <TextInput
               style={styles.textInput}
               value={purchasePrice}
               onChangeText={setPurchasePrice}
               placeholder="Purchase price"
               placeholderTextColor={theme.colors.placeholderText}
               keyboardType="numeric"
             />
          </View>

          <View style={styles.inputGroup}>
                         <TextInput
               style={styles.textInput}
               value={storeName}
               onChangeText={setStoreName}
               placeholder="Enter store name"
               placeholderTextColor={theme.colors.placeholderText}
             />
          </View>
        </View>

        {/* Warranty Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warranty Information</Text>
          
                     <View style={styles.inputGroup}>
             <TextInput
               style={styles.textInput}
               value={warrantyDuration}
               onChangeText={setWarrantyDuration}
               placeholder="Enter warranty duration (months)"
               placeholderTextColor={theme.colors.placeholderText}
               keyboardType="numeric"
             />
           </View>

                     <View style={styles.warrantyExpiryInfo}>
                           {warrantyExpiryDate ? (
                             <View style={styles.warrantyStatusRow}>
                               <View style={[
                                 styles.warrantyBadge,
                                 { backgroundColor: new Date(warrantyExpiryDate) < new Date() ? theme.colors.systemRed : theme.colors.systemGreen }
                               ]}>
                                 <Text style={styles.warrantyBadgeText}>
                                   {new Date(warrantyExpiryDate) < new Date() ? 'Expired' : 'Active'}
                                 </Text>
                               </View>
                               <Text style={styles.warrantyDateText}>
                                 {warrantyExpiryDate}
                               </Text>
                             </View>
                           ) : (
                             <Text style={styles.warrantyPlaceholderText}>
                               Select purchase date and duration
                             </Text>
                           )}
           </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.textInput, { height: 80, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes about the item..."
              placeholderTextColor={theme.colors.placeholderText}
              multiline
            />
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitButton, (isSubmitting || isUploading) && styles.submitButtonDisabled]}
          onPress={handleSaveDevice}
          disabled={isSubmitting || isUploading}
        >
          {(isSubmitting || isUploading) ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Add Item</Text>
          )}
        </Pressable>

        <View style={styles.bottomSpacing} />
      </ScrollView>
         
         {/* Category Picker Modal */}
         <Modal
           visible={showCategoryPicker}
           transparent
           animationType="slide"
           onRequestClose={() => setShowCategoryPicker(false)}
         >
           <View style={styles.modalOverlay}>
             <Pressable 
               style={styles.modalBackdrop} 
               onPress={() => setShowCategoryPicker(false)} 
             />
             
             <View style={styles.pickerContainer}>
               {/* Header */}
               <View style={styles.pickerHeader}>
                 <Pressable onPress={() => {
                   setTempSelectedCategory(selectedCategory); // Reset to original selection
                   setShowCategoryPicker(false);
                 }}>
                   <Text style={styles.cancelButton}>Cancel</Text>
                 </Pressable>
                 <Text style={styles.pickerTitle}>Category</Text>
                 <Pressable onPress={() => {
                   setSelectedCategory(tempSelectedCategory); // Apply the temporary selection
                   setCategory(tempSelectedCategory);
                   setShowCategoryPicker(false);
                 }}>
                   <Text style={styles.doneButton}>Done</Text>
                 </Pressable>
               </View>
               
               {/* Picker Wheel */}
               <View style={styles.pickerWheel}>
                 {categories.map((cat) => (
                   <Pressable
                     key={cat}
                     style={[
                       styles.pickerOption,
                       tempSelectedCategory === cat && styles.pickerOptionSelected
                     ]}
                     onPress={() => {
                       setTempSelectedCategory(cat); // Only update temporary selection
                     }}
                   >
                                           <Text style={[
                        styles.pickerOptionText,
                        tempSelectedCategory === cat && styles.pickerOptionTextSelected
                      ]}>
                        {cat}
                      </Text>
                   </Pressable>
                 ))}
               </View>
             </View>
           </View>
                  </Modal>

         {/* Date Picker Modal */}
         <Modal
           visible={showDatePicker}
           transparent
           animationType="slide"
           onRequestClose={() => setShowDatePicker(false)}
         >
           <View style={styles.modalOverlay}>
             <Pressable 
               style={styles.modalBackdrop} 
               onPress={() => setShowDatePicker(false)} 
             />
             
             <View style={styles.datePickerContainer}>
               {/* Header */}
               <View style={styles.pickerHeader}>
                 <Pressable onPress={() => setShowDatePicker(false)}>
                   <Text style={styles.cancelButton}>Cancel</Text>
                 </Pressable>
                 <Text style={styles.pickerTitle}>Purchase Date</Text>
                 <Pressable onPress={() => {
                   setSelectedDate(tempDate);
                   setShowDatePicker(false);
                 }}>
                   <Text style={styles.doneButton}>Done</Text>
                 </Pressable>
               </View>
               
               {/* Date Wheel Picker */}
               <View style={styles.dateWheelContainer}>
                                   {/* Month Column */}
                  <View style={styles.wheelColumn}>
                                         <ScrollView 
                       ref={monthScrollRef}
                       showsVerticalScrollIndicator={false}
                       snapToInterval={44}
                       decelerationRate="fast"
                       bounces={true}
                       scrollEnabled={true} // Ensure scrolling is enabled
                       nestedScrollEnabled={true} // For Android
                       contentContainerStyle={styles.wheelScrollContent}
                       style={styles.wheelScrollView} // Add this style
                       onScrollBeginDrag={() => setHasUserScrolled(true)}
                     >
                     {months.map((month, index) => (
                       <Pressable
                         key={month}
                         style={[
                           styles.wheelOption,
                                                       tempDate?.getMonth() === index && styles.wheelOptionSelected
                         ]}
                                                                             onPress={() => {
                             const newDate = new Date(tempDate.getTime()); // Create proper copy
                             const currentDay = tempDate.getDate(); // Preserve current day
                             newDate.setMonth(index);
                             
                             // Check if the current day is valid for the new month
                             const daysInNewMonth = new Date(newDate.getFullYear(), index + 1, 0).getDate();
                             if (currentDay <= daysInNewMonth) {
                               newDate.setDate(currentDay); // Keep the same day if valid
                             } else {
                               newDate.setDate(daysInNewMonth); // Use last day of month if current day is invalid
                             }
                             
                             setTempDate(newDate);
                             setHasUserSelectedDate(true); // Mark that user manually selected a date
                           }}
                       >
                         <Text style={[
                           styles.wheelOptionText,
                           tempDate?.getMonth() === index && styles.wheelOptionTextSelected
                         ]}>
                           {month}
                         </Text>
                       </Pressable>
                     ))}
                   </ScrollView>
                 </View>
                 
                                   {/* Day Column */}
                  <View style={styles.wheelColumn}>
                                         <ScrollView 
                       ref={dayScrollRef}
                       showsVerticalScrollIndicator={false}
                       snapToInterval={44}
                       decelerationRate="fast"
                       bounces={true}
                       scrollEnabled={true} // Ensure scrolling is enabled
                       nestedScrollEnabled={true} // For Android
                       contentContainerStyle={styles.wheelScrollContent}
                       style={styles.wheelScrollView} // Add this style
                       onScrollBeginDrag={() => setHasUserScrolled(true)}
                     >
                     {days.map((day) => (
                       <Pressable
                         key={day}
                         style={[
                           styles.wheelOption,
                                                       tempDate?.getDate() === day && styles.wheelOptionSelected
                         ]}
                                                                             onPress={() => {
                             const newDate = new Date(tempDate.getTime());
                             newDate.setDate(day);
                             setTempDate(newDate);
                             setHasUserSelectedDate(true); // Mark that user manually selected a date
                           }}
                       >
                         <Text style={[
                           styles.wheelOptionText,
                           tempDate?.getDate() === day && styles.wheelOptionTextSelected
                         ]}>
                           {day}
                         </Text>
                       </Pressable>
                     ))}
                   </ScrollView>
                 </View>
                 
                                   {/* Year Column */}
                  <View style={styles.wheelColumn}>
                    <ScrollView 
                      ref={yearScrollRef}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={44}
                      decelerationRate="fast"
                      bounces={true}
                      scrollEnabled={true} // Ensure scrolling is enabled
                      nestedScrollEnabled={true} // For Android
                      contentContainerStyle={styles.wheelScrollContent}
                      style={styles.wheelScrollView} // Add this style
                      onScrollBeginDrag={() => setHasUserScrolled(true)}
                    >
                     {years.map((year) => (
                       <Pressable
                         key={year}
                         style={[
                           styles.wheelOption,
                                                       tempDate?.getFullYear() === year && styles.wheelOptionSelected
                         ]}
                                                                             onPress={() => {
                             const newDate = new Date(tempDate.getTime());
                             newDate.setFullYear(year);
                             setTempDate(newDate);
                             setHasUserSelectedDate(true); // Mark that user manually selected a date
                           }}
                       >
                         <Text style={[
                           styles.wheelOptionText,
                           tempDate?.getFullYear() === year && styles.wheelOptionTextSelected
                         ]}>
                           {year}
                         </Text>
                       </Pressable>
                     ))}
                   </ScrollView>
                 </View>
               </View>
             </View>
           </View>
         </Modal>
      </SafeAreaView>
      
      {/* Loading Overlay */}
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.systemBlue} />
            <Text style={styles.loadingText}>Adding Item...</Text>
            <Text style={styles.loadingSubtext}>Please wait while we process your item</Text>
          </View>
        </View>
      )}
    </View>
     );
   }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize.title1,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.label,
  },
  headerActions: {
    width: 40, // Same width as back button for balance
  },
  saveButton: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
            color: theme.colors.systemBlue,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing['3xl'],
  },
  sectionTitle: {
    fontSize: theme.fontSize.title3,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.label,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.xs,
  },
           textInput: {
      borderWidth: 1,
      borderColor: theme.colors.neutral[200],
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      fontSize: theme.fontSize.body,
      color: theme.colors.label,
      backgroundColor: theme.colors.systemBackground,
      shadowColor: theme.colors.label,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  categoryChip: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  categoryChipActive: {
            backgroundColor: theme.colors.systemBlue,
        borderColor: theme.colors.systemBlue,
  },
  categoryChipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[700],
  },
  categoryChipTextActive: {
    color: theme.colors.white,
  },
  imageSection: {
    marginTop: theme.spacing.lg,
  },
  imageLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.xs,
  },
  textArea: {
    minHeight: 100,
    paddingTop: theme.spacing.lg,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: theme.colors.systemBlue,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xxxl,
    shadowColor: theme.colors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.systemBackground,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  bottomSpacing: {
    height: theme.spacing.xxxl,
  },
           dropdownContainer: {
      position: 'relative',
      borderWidth: 1,
      borderColor: theme.colors.neutral[200],
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      shadowColor: theme.colors.label,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
     dropdownButton: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: theme.spacing.lg,
     paddingVertical: theme.spacing.lg,
     backgroundColor: theme.colors.systemBackground,
   },
     dropdownText: {
     fontSize: theme.fontSize.body,
     color: theme.colors.label,
   },
     dropdownPlaceholder: {
     color: theme.colors.placeholderText,
   },
     dropdownOptions: {
     position: 'absolute',
     top: '100%',
     left: 0,
     right: 0,
     backgroundColor: theme.colors.systemBackground,
     borderWidth: 1,
     borderColor: theme.colors.neutral[200],
     borderRadius: theme.borderRadius.md,
     overflow: 'hidden',
     zIndex: 1,
   },
     dropdownOption: {
     paddingHorizontal: theme.spacing.lg,
     paddingVertical: theme.spacing.lg,
     borderBottomWidth: 1,
     borderBottomColor: theme.colors.neutral[600],
   },
     dropdownOptionText: {
     fontSize: theme.fontSize.body,
     color: theme.colors.label,
   },
           uploadRow: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
       uploadZone: {
      flex: 1,
      backgroundColor: theme.colors.neutral[100],
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.neutral[200],
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
      shadowColor: theme.colors.label,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
       imagePreviewContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
      shadowColor: theme.colors.label,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
       imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: theme.borderRadius.md,
    },
   imageWrapper: {
     position: 'relative',
     width: '100%',
   },
   compressionOverlay: {
     position: 'absolute',
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: 'rgba(0, 0, 0, 0.6)',
     justifyContent: 'center',
     alignItems: 'center',
     borderRadius: theme.borderRadius.md,
   },
   compressionText: {
     color: theme.colors.white,
     fontSize: theme.fontSize.sm,
     marginTop: theme.spacing.xs,
     fontWeight: '500',
   },
               removeImageButton: {
       position: 'absolute',
       top: -11,
       right: -8,
       width: 24,
       height: 24,
       borderRadius: theme.borderRadius.pill,
       backgroundColor: theme.colors.systemRed,
       alignItems: 'center',
       justifyContent: 'center',
       shadowColor: theme.colors.label,
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.25,
       shadowRadius: 4,
       elevation: 5,
     },
               removeImageButtonText: {
       color: theme.colors.systemBackground,
       fontSize: theme.fontSize.callout,
       fontWeight: theme.fontWeight.semibold,
       textAlign: 'center',
       textAlignVertical: 'center',
       includeFontPadding: false,
       width: 24,
       height: 24,
       lineHeight: 24,
       marginTop: -2,
     },
  uploadContent: {
    alignItems: 'center',
  },
     uploadText: {
     fontSize: theme.fontSize.body,
     color: theme.colors.neutral[400],
     marginTop: theme.spacing.sm,
     textAlign: 'center',
   },
     uploadSuccessText: {
     fontSize: theme.fontSize.body,
     color: theme.colors.systemGreen,
     marginTop: theme.spacing.sm,
   },
     changePhotoButton: {
     marginTop: theme.spacing.sm,
   },
     changePhotoText: {
     fontSize: theme.fontSize.footnote,
     color: theme.colors.systemBlue,
     textDecorationLine: 'underline',
   },
                       warrantyExpiryInfo: {
       backgroundColor: theme.colors.systemBackground,
       borderRadius: theme.borderRadius.md,
       padding: theme.spacing.lg,
       borderWidth: 1,
       borderColor: theme.colors.neutral[200],
       minHeight: 60,
       flexDirection: 'row',
       alignItems: 'center',
       justifyContent: 'center',
       shadowColor: theme.colors.label,
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.08,
       shadowRadius: 8,
       elevation: 3,
     },
       warrantyExpiryLabel: {
      fontSize: theme.fontSize.body,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.systemGreen,
    },
            warrantyExpiredText: {
      color: theme.colors.systemRed,
    },
     warrantyStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
     warrantyBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
      minWidth: 60,
      alignItems: 'center',
    },
     warrantyBadgeText: {
      fontSize: theme.fontSize.footnote,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.systemBackground,
    },
     warrantyDateText: {
      fontSize: theme.fontSize.body,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.label,
    },
     warrantyPlaceholderText: {
      fontSize: theme.fontSize.body,
      fontWeight: theme.fontWeight.medium,
      color: theme.colors.placeholderText,
    },
     backButton: {
     flexDirection: 'row',
     alignItems: 'center',
     marginRight: theme.spacing.sm,
   },
     backText: {
     fontSize: theme.fontSize.body,
     color: theme.colors.neutral[400],
     marginLeft: theme.spacing.xs,
   },
  saveButtonText: {
    fontSize: theme.fontSize.body,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.systemBlue,
  },
                                               proFeatureRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: theme.spacing.lg,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.lg,
          backgroundColor: theme.colors.systemBackground,
          borderRadius: theme.borderRadius.md,
          shadowColor: theme.colors.label,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
  proFeatureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
     proFeatureText: {
     fontSize: theme.fontSize.body,
     color: theme.colors.neutral[400],
     marginLeft: theme.spacing.sm,
   },
     proBadge: {
     backgroundColor: 'transparent',
     paddingHorizontal: theme.spacing.xs,
     paddingVertical: theme.spacing.xs,
     marginLeft: 'auto',
     marginRight: theme.spacing.md,
     fontSize: theme.fontSize.footnote,
     fontWeight: theme.fontWeight.semibold,
     color: theme.colors.systemGreen,
     letterSpacing: 0.3,
   },
  
           dateInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.neutral[200],
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.systemBackground,
      shadowColor: theme.colors.label,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
           dateInput: {
      flex: 1,
      paddingRight: theme.spacing.sm,
      fontSize: theme.fontSize.body,
      color: theme.colors.label,
    },
   
       // Apple-style picker styles
         categoryButton: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       borderWidth: 1,
       borderColor: theme.colors.neutral[200],
       borderRadius: theme.borderRadius.md,
       paddingHorizontal: theme.spacing.lg,
       paddingVertical: theme.spacing.lg,
       backgroundColor: theme.colors.systemBackground,
       shadowColor: theme.colors.label,
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.08,
       shadowRadius: 8,
       elevation: 3,
     },
       categoryButtonText: {
      fontSize: theme.fontSize.body,
      color: theme.colors.label,
    },
       categoryPlaceholder: {
      color: theme.colors.placeholderText,
    },
   modalOverlay: {
     flex: 1,
     justifyContent: 'flex-end',
     backgroundColor: 'rgba(0,0,0,0.4)',
   },
   modalBackdrop: {
     flex: 1,
   },
       pickerContainer: {
      backgroundColor: theme.colors.secondarySystemBackground,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      paddingBottom: theme.spacing.safeBottom, // Safe area bottom
    },
       pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
      backgroundColor: theme.colors.systemBackground,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.colors.neutral[300],
    },
       cancelButton: {
      fontSize: theme.fontSize.body,
      color: theme.colors.systemBlue,
    },
       pickerTitle: {
      fontSize: theme.fontSize.body,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.label,
    },
       doneButton: {
      fontSize: theme.fontSize.body,
      color: theme.colors.systemBlue,
      fontWeight: theme.fontWeight.semibold,
    },
               pickerWheel: {
       paddingVertical: theme.spacing.xl,
       paddingHorizontal: theme.spacing.sm,
     },
               pickerOption: {
       paddingHorizontal: theme.spacing.lg,
       paddingVertical: theme.spacing.lg,
       alignItems: 'center',
       backgroundColor: 'transparent',
       borderRadius: theme.borderRadius.md,
       marginHorizontal: theme.spacing.sm,
       marginVertical: theme.spacing.xs,
     },
               pickerOptionSelected: {
       backgroundColor: theme.colors.systemBlue,
       borderRadius: theme.borderRadius.md,
       marginHorizontal: theme.spacing.sm,
       marginVertical: theme.spacing.xs,
     },
       pickerOptionText: {
      fontSize: theme.fontSize.title3,
      color: theme.colors.label,
      fontWeight: theme.fontWeight.normal,
    },
       pickerOptionTextSelected: {
      color: theme.colors.systemBackground,
      fontWeight: theme.fontWeight.semibold,
    },

       // Date picker styles
         dateButton: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       borderWidth: 1,
       borderColor: theme.colors.neutral[200],
       borderRadius: theme.borderRadius.md,
       paddingHorizontal: theme.spacing.lg,
       paddingVertical: theme.spacing.lg,
       backgroundColor: theme.colors.systemBackground,
       shadowColor: theme.colors.label,
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.08,
       shadowRadius: 8,
       elevation: 3,
     },
       dateButtonText: {
      fontSize: theme.fontSize.body,
      color: theme.colors.label,
    },
       datePlaceholder: {
      color: theme.colors.placeholderText,
    },
       datePickerContainer: {
      backgroundColor: theme.colors.secondarySystemBackground,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      paddingBottom: theme.spacing.safeBottom,
      maxHeight: '60%',
    },
       dateWheelContainer: {
      flexDirection: 'row',
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.xl,
    },
               wheelColumn: {
       flex: 1,
       height: 200, // Fixed height for scrollable area
       marginHorizontal: theme.spacing.xs,
     },
    wheelScrollContent: {
      paddingVertical: 0, // Remove padding to allow proper alignment
    },
    wheelScrollView: {
      maxHeight: 200,
    },
               wheelOption: {
       height: theme.spacing.minTouch,
       justifyContent: 'center',
       alignItems: 'center',
       borderRadius: theme.borderRadius.sm,
       marginVertical: 1,
       paddingHorizontal: theme.spacing.md,
     },
       wheelOptionSelected: {
      backgroundColor: theme.colors.systemBlue,
    },
       wheelOptionText: {
      fontSize: theme.fontSize.title3,
      color: theme.colors.label,
      fontWeight: theme.fontWeight.normal,
    },
               wheelOptionTextSelected: {
      color: theme.colors.systemBackground,
      fontWeight: theme.fontWeight.semibold,
    },



    // Compression styles
    compressionInfoContainer: {
      backgroundColor: theme.colors.secondary[50],
      borderWidth: 1,
      borderColor: theme.colors.secondary[200],
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
    },
    compressionInfo: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.secondary[700],
      textAlign: 'center',
      fontWeight: theme.fontWeight.medium,
      lineHeight: 20,
    },
    compressionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.success[50],
      borderWidth: 1,
      borderColor: theme.colors.success[200],
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    compressionStatusText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.success[700],
      fontWeight: theme.fontWeight.medium,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    loadingContainer: {
      backgroundColor: theme.colors.white,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing['2xl'],
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 200,
      ...theme.shadows.lg,
    },
    loadingText: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.neutral[900],
      marginTop: theme.spacing.md,
      textAlign: 'center',
    },
    loadingSubtext: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.neutral[600],
      marginTop: theme.spacing.sm,
      textAlign: 'center',
    },
  });