import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Image as ImageIcon, X, Plus, Minus, AlertTriangle, CheckCircle, Eye, EyeOff, ArrowLeft, ChevronDown, Calendar } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { ModalProNotice } from '@/src/components/ModalProNotice';
import { UploadZone } from '@/src/components/UploadZone';
import { uploadDeviceImage, uploadReceiptImage, getStorageUrl } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export default function AddDeviceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addDevice } = useData();
  const [showProNotice, setShowProNotice] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isDatePickerFocused, setIsDatePickerFocused] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    serial: '',
    category: '',
    purchaseDate: '',
    purchasePrice: '',
    store: '',
    warrantyDuration: '',
  });
  
  // Simplified image state - only store the local URIs for immediate display
  const [deviceImageUri, setDeviceImageUri] = useState<string | null>(null);
  const [receiptImageUri, setReceiptImageUri] = useState<string | null>(null);

  // Refs for date picker ScrollViews
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  // Debug: Monitor image state changes
  useEffect(() => {
    console.log('=== IMAGE STATE CHANGED ===');
    console.log('Device Image URI:', deviceImageUri);
    console.log('Receipt Image URI:', receiptImageUri);
  }, [deviceImageUri, receiptImageUri]);

  // Auto-scroll to current date when date picker opens
  useEffect(() => {
    if (showDatePicker) {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentDay = now.getDate();
      const currentYear = now.getFullYear();
      
      // Scroll to current month (each month is 44px height)
      setTimeout(() => {
        monthScrollRef.current?.scrollTo({ y: currentMonth * 44, animated: true });
      }, 100);
      
      // Scroll to current day (each day is 44px height)
      setTimeout(() => {
        dayScrollRef.current?.scrollTo({ y: (currentDay - 1) * 44, animated: true });
      }, 150);
      
      // Scroll to current year (current year is at index 0)
      setTimeout(() => {
        yearScrollRef.current?.scrollTo({ y: 0, animated: true });
      }, 200);
    }
  }, [showDatePicker]);

  // Image upload functions - moved inside component for proper scope
  const handleDeviceImageUpload = useCallback(async (imageUri: string) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    try {
      console.log('=== UPLOADING DEVICE IMAGE ===');
      console.log('Image URI:', imageUri.substring(0, 100) + '...');
      console.log('Setting deviceImageUri to:', imageUri);
      
      // Store the local URI for immediate display in cards
      setDeviceImageUri(imageUri);
      
      // Convert image URI to File object for Supabase upload
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const tempFileName = `temp_device_${Date.now()}.jpg`;
      const file = new File([blob], tempFileName, { type: 'image/jpeg' });
      
      console.log('File created:', file.name, 'Size:', blob.size);
      
      // Upload to Supabase Storage for backup/sync
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('device-photos')
        .upload(`${user.id}/${tempFileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        console.error('Upload error details:', uploadError.message);
        Alert.alert('Upload Error', 'Failed to upload image to cloud storage. Image will be stored locally only.');
        return;
      }
      
      // Get the public URL from Supabase
      const { data: urlData } = supabase.storage
        .from('device-photos')
        .getPublicUrl(`${user.id}/${tempFileName}`);
      
      console.log('Supabase upload successful, public URL:', urlData.publicUrl);
      console.log('Device image state updated successfully');
      
      // Store both local URI (for display) and Supabase URL (for backup)
      // setDeviceImage(imageUri); // Local storage for immediate display - REMOVED
      // setDeviceImageSupabaseUrl(urlData.publicUrl); // Supabase URL for backup - REMOVED
      
    } catch (error) {
      console.error('Device image upload error:', error);
      Alert.alert('Error', 'Failed to process device image. Image will be stored locally only.');
    }
  }, [user]);

  const handleReceiptImageUpload = useCallback(async (imageUri: string) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }
    
    try {
      console.log('=== UPLOADING RECEIPT IMAGE ===');
      console.log('Image URI:', imageUri.substring(0, 100) + '...');
      console.log('Setting receiptImageUri to:', imageUri);
      
      // Store the original URI for immediate display
      setReceiptImageUri(imageUri);
      
      // Convert image URI to File object for Supabase upload
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const tempFileName = `temp_receipt_${Date.now()}.jpg`;
      const file = new File([blob], tempFileName, { type: 'image/jpeg' });
      
      console.log('File created:', file.name, 'Size:', blob.size);
      
      // Upload to Supabase Storage for backup/sync
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('device-invoices')
        .upload(`${user.id}/${tempFileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        console.error('Upload error details:', uploadError.message);
        Alert.alert('Upload Error', 'Failed to upload receipt to cloud storage. Receipt will be stored locally only.');
        return;
      }
      
      // Get the public URL from Supabase
      const { data: urlData } = supabase.storage
        .from('device-invoices')
        .getPublicUrl(`${user.id}/${tempFileName}`);
      
      console.log('Supabase upload successful, public URL:', urlData.publicUrl);
      console.log('Receipt image state updated successfully');
      
      // Store both local URI (for display) and Supabase URL (for backup)
      // setReceiptImage(imageUri); // Local storage for immediate display - REMOVED
      // setReceiptImageSupabaseUrl(urlData.publicUrl); // Supabase URL for backup - REMOVED
      
    } catch (error) {
      console.error('Receipt image upload error:', error);
      Alert.alert('Error', 'Failed to process receipt image. Receipt will be stored locally only.');
    }
  }, [user]);

  const handleAddItem = useCallback(async () => {
    console.log('=== ADD ITEM FUNCTION CALLED ===');
    console.log('Current form data:', formData);
    console.log('Device image URI:', deviceImageUri);
    console.log('Receipt image URI:', receiptImageUri);
    console.log('User:', user ? `logged in (${user.id})` : 'not logged in');
    
    // Log form validation details
    console.log('=== FORM VALIDATION DETAILS ===');
    console.log('Name:', formData.name ? `"${formData.name}"` : 'MISSING');
    console.log('Purchase Date:', formData.purchaseDate ? `"${formData.purchaseDate}"` : 'MISSING');
    console.log('Purchase Price:', formData.purchasePrice ? `"${formData.purchasePrice}"` : 'MISSING');
    console.log('Category:', formData.category ? `"${formData.category}"` : 'MISSING');
    console.log('Warranty Duration:', formData.warrantyDuration ? `"${formData.warrantyDuration} months"` : 'OPTIONAL');
    console.log('Device Image:', deviceImageUri ? 'EXISTS' : 'MISSING');
    console.log('Receipt Image:', receiptImageUri ? 'EXISTS' : 'MISSING');
    
    if (!user) {
      console.log('User not logged in, showing error');
      Alert.alert('Error', 'You must be logged in to add an item.');
      return;
    }

    // Check for mandatory fields
    const missingFields = [];
    if (!formData.name) missingFields.push('Item name');
    if (!formData.purchaseDate) missingFields.push('Purchase date');
    if (!formData.purchasePrice) missingFields.push('Purchase price');
    if (!formData.category) missingFields.push('Category');
    if (!receiptImageUri) missingFields.push('Receipt photo');
    // Note: warranty_duration is now optional - can be added later via warranties table

    console.log('Missing fields:', missingFields);

    if (missingFields.length > 0) {
      console.log('Showing missing fields alert');
      Alert.alert(
        'Missing Required Information',
        `Please fill in the following required fields:\n\n${missingFields.join('\n')}`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    console.log('All validation passed, proceeding with item addition...');
    setIsSubmitting(true);

    try {
      console.log('Starting item addition...', { 
        formData, 
        deviceImageUri, 
        receiptImageUri, 
        timestamp: new Date().toISOString() 
      });
      
      // Prepare item data for DataContext
      const deviceData = {
        user_id: user.id,
        name: formData.name,
        brand: formData.brand || undefined,
        model: formData.brand || undefined, // Use brand as model for now
        category: formData.category || undefined,
        serial_number: formData.serial || undefined,
        purchase_date: formData.purchaseDate,
        purchase_price: parseFloat(formData.purchasePrice),
        store_name: formData.store || undefined,
        notes: '', // Default empty notes
        image_url: deviceImageUri || undefined, // Direct URL to device image
      };

      console.log('=== DEVICE DATA PREPARED ===');
      console.log('Device image URI (local):', deviceImageUri);
      console.log('Receipt image URI (local):', receiptImageUri);
      console.log('Image URL:', deviceData.image_url);
      console.log('Store name:', deviceData.store_name);
      console.log('Final device data:', deviceData);
      console.log('Column names being sent:', Object.keys(deviceData));
      console.log('About to call addDevice...');

      // Use DataContext to add device (this will save locally first, then sync with Supabase)
      const newDevice = await addDevice(deviceData);

      console.log('Item saved successfully to local storage');
      
      // Create warranty entry in warranties table
      if (newDevice?.id && formData.warrantyDuration) {
        try {
          console.log('Creating warranty entry for device:', newDevice.id);
          
          // Calculate warranty dates
          const purchaseDate = new Date(formData.purchaseDate);
          const warrantyEndDate = new Date(purchaseDate);
          warrantyEndDate.setMonth(warrantyEndDate.getMonth() + parseInt(formData.warrantyDuration));
          
          // Create warranty entry
          const { error: warrantyError } = await supabase
            .from('warranties')
            .insert({
              device_id: newDevice.id,
              user_id: user.id,
              warranty_type: 'manufacturer', // Default to manufacturer warranty
              provider_name: formData.brand || 'Unknown',
              start_date: formData.purchaseDate,
              end_date: warrantyEndDate.toISOString().split('T')[0],
              duration_months: parseInt(formData.warrantyDuration),
              is_active: true
            });
          
          if (warrantyError) {
            console.error('Error creating warranty entry:', warrantyError);
          } else {
            console.log('Warranty entry created successfully');
          }
        } catch (error) {
          console.error('Error creating warranty:', error);
        }
      }
      
      // Create receipt entry in receipts table
      if (receiptImageUri) {
        try {
          console.log('Creating receipt entry for device:', newDevice?.id);
          
          // Create receipt entry
          const { error: receiptError } = await supabase
            .from('receipts')
            .insert({
              user_id: user.id,
              device_id: newDevice?.id,
              store_name: formData.store || 'Unknown',
              purchase_date: formData.purchaseDate,
              total_amount: parseFloat(formData.purchasePrice),
              image_url: receiptImageUri,
              notes: `Receipt for ${formData.name}`
            });
          
          if (receiptError) {
            console.error('Error creating receipt entry:', receiptError);
          } else {
            console.log('Receipt entry created successfully');
          }
        } catch (error) {
          console.error('Error creating receipt:', error);
        }
      }

      console.log('Navigating to dashboard...');

      // Navigate to dashboard immediately
      router.replace('/(tabs)');

    } catch (error) {
      console.error('Error adding item:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      Alert.alert('Error', `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  }, [formData, deviceImageUri, receiptImageUri, user, addDevice, router]);

  const handleOcrToggle = useCallback(() => {
    setShowProNotice(true);
  }, []);

  const requestPermissions = useCallback(async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library permissions are required to take photos and select images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }, []);

  const handleDeviceCamera = useCallback(async () => {
    if (!(await requestPermissions())) return;
    
    try {
      console.log('=== DEVICE CAMERA FUNCTION ===');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1, // Set quality to 1 as compression is handled by compressImageAdvanced
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Original device image captured:', imageUri);
        
        // Store the original URI for display
        setDeviceImageUri(imageUri);
        
        // Upload to Supabase Storage
        console.log('Starting Supabase Storage upload for device image...');
        await handleDeviceImageUpload(imageUri);
        console.log('Device image processed successfully');
      }
    } catch (error) {
      console.error('Error capturing device image:', error);
      Alert.alert('Error', 'Failed to capture device image. Please try again.');
    }
  }, [requestPermissions, handleDeviceImageUpload]);

  const handleDeviceLibrary = useCallback(async () => {
    if (!(await requestPermissions())) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1, // Set quality to 1 as compression is handled by compressImageAdvanced
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Original device image selected');
        
        // Store the original URI for display
        setDeviceImageUri(imageUri);
        
        // Upload to Supabase Storage
        await handleDeviceImageUpload(imageUri);
        console.log('Device image processed successfully');
      }
    } catch (error) {
      console.error('Error selecting device image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  }, [requestPermissions, handleDeviceImageUpload]);

  const handleReceiptCamera = useCallback(async () => {
    if (!(await requestPermissions())) return;
    
    try {
      console.log('=== RECEIPT CAMERA FUNCTION ===');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Portrait for receipts
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Original receipt image captured:', imageUri);
        
        // Store the original URI for display
        setReceiptImageUri(imageUri);
        
        // Upload to Supabase Storage
        console.log('Starting Supabase Storage upload for receipt image...');
        await handleReceiptImageUpload(imageUri);
        console.log('Receipt image processed successfully');
      }
    } catch (error) {
      console.error('Error capturing receipt image:', error);
      Alert.alert('Error', 'Failed to capture receipt image. Please try again.');
    }
  }, [requestPermissions, handleReceiptImageUpload]);

  const handleReceiptLibrary = useCallback(async () => {
    if (!(await requestPermissions())) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Portrait for receipts
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('Original receipt image selected');
        
        // Store the original URI for display
        setReceiptImageUri(imageUri);
        
        // Upload to Supabase Storage
        await handleReceiptImageUpload(imageUri);
        console.log('Receipt image processed successfully');
      }
    } catch (error) {
      console.error('Error selecting receipt image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  }, [requestPermissions, handleReceiptImageUpload]);

  const removeDeviceImage = useCallback(() => {
    setDeviceImageUri(null);
  }, []);

  const removeReceiptImage = useCallback(() => {
    setReceiptImageUri(null);
  }, []);

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateWarrantyExpiry = () => {
    if (!formData.purchaseDate || !formData.warrantyDuration) return '';
    
    const purchaseDate = new Date(formData.purchaseDate);
    const expiryDate = new Date(purchaseDate);
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(formData.warrantyDuration));
    
    return expiryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Item</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Item Photo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Photo</Text>
                     <UploadZone
             onCameraPress={handleDeviceCamera}
             onLibraryPress={handleDeviceLibrary}
             selectedImage={deviceImageUri}
             onRemoveImage={removeDeviceImage}
             isRequired={false}
           />
        </View>

        {/* Receipt Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receipt Photo *</Text>
                     <UploadZone
             onCameraPress={handleReceiptCamera}
             onLibraryPress={handleReceiptLibrary}
             selectedImage={receiptImageUri}
             onRemoveImage={removeReceiptImage}
             isRequired={true}
           />
         
          <View style={styles.ocrContainer}>
            <View style={styles.ocrLeft}>
              <Text style={styles.ocrHint}>💡 Auto receipt extraction</Text>
            </View>
            <View style={styles.ocrRight}>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
              <Pressable
                style={[styles.toggle, ocrEnabled && styles.toggleActive]}
                onPress={handleOcrToggle}
              >
                <View style={[styles.toggleKnob, ocrEnabled && styles.toggleKnobActive]} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Item Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Item name (e.g., iPhone 15 Pro) *"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholderTextColor={theme.colors.neutral[400]}
          />
          <TextInput
            style={styles.input}
            placeholder="Brand (e.g., Apple)"
            value={formData.brand}
            onChangeText={(text) => setFormData({ ...formData, brand: text })}
            placeholderTextColor={theme.colors.neutral[400]}
          />
          <TextInput
            style={styles.input}
            placeholder="Serial number (optional)"
            value={formData.serial}
            onChangeText={(text) => setFormData({ ...formData, serial: text })}
            placeholderTextColor={theme.colors.neutral[400]}
          />
          <Pressable 
            style={styles.categoryPickerButton} 
            onPress={() => setShowCategoryPicker(true)}
          >
            <View style={styles.categoryPickerContent}>
              <Text style={[
                styles.categoryPickerText,
                formData.category ? styles.categoryPickerTextSelected : styles.categoryPickerTextPlaceholder
              ]}>
                {formData.category || 'Select category *'}
              </Text>
            </View>
            <ChevronDown size={20} color={theme.colors.neutral[600]} />
          </Pressable>
        </View>

        {/* Purchase Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Details</Text>
          <Pressable 
            style={[
              styles.datePickerButton, 
              isDatePickerFocused && styles.datePickerButtonFocused
            ]} 
            onPress={() => {
              // Set current date if no date is selected
              if (!formData.purchaseDate) {
                const now = new Date();
                const currentDate = now.toISOString().split('T')[0];
                setFormData({ ...formData, purchaseDate: currentDate });
              }
              setShowDatePicker(true);
              setIsDatePickerFocused(true);
            }}
            onPressIn={() => setIsDatePickerFocused(true)}
            onPressOut={() => setIsDatePickerFocused(false)}
          >
            <View style={styles.datePickerContent}>
              <Text 
                style={[
                  styles.datePickerText, 
                  !formData.purchaseDate && styles.datePickerPlaceholder
                ]} 
                numberOfLines={1}
              >
                {formData.purchaseDate ? formatDisplayDate(formData.purchaseDate) : 'Select date *'}
              </Text>
              <View style={[
                styles.calendarIconContainer,
                isDatePickerFocused && styles.calendarIconContainerFocused
              ]}>
                <Calendar size={20} color={isDatePickerFocused ? theme.colors.primary[600] : theme.colors.neutral[600]} />
              </View>
            </View>
          </Pressable>
                     <TextInput
             style={styles.input}
             placeholder="Purchase price *"
             value={formData.purchasePrice}
             onChangeText={(text) => setFormData({ ...formData, purchasePrice: text })}
             keyboardType="numeric"
             placeholderTextColor={theme.colors.neutral[400]}
           />
          <TextInput
            style={styles.input}
            placeholder="Store/retailer"
            value={formData.store}
            onChangeText={(text) => setFormData({ ...formData, store: text })}
            placeholderTextColor={theme.colors.neutral[400]}
          />
        </View>

        {/* Warranty Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warranty Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Warranty duration (months) *"
            value={formData.warrantyDuration}
            onChangeText={(text) => setFormData({ ...formData, warrantyDuration: text })}
            keyboardType="numeric"
            placeholderTextColor={theme.colors.neutral[400]}
          />
          <View style={styles.warrantyPreview}>
            <Text style={styles.warrantyPreviewLabel}>Warranty expires on</Text>
            <Text style={styles.warrantyPreviewDate}>
              {calculateWarrantyExpiry() || 'Select purchase date'}
            </Text>
          </View>
        </View>

        <Pressable 
          style={[styles.addButton, isSubmitting && styles.addButtonDisabled]} 
          onPress={handleAddItem}
          disabled={isSubmitting}
        >
                   {isSubmitting ? (
           <Text style={styles.addButtonText}>Adding Item...</Text>
         ) : (
           <Text style={styles.addButtonText}>Add Item</Text>
         )}
        </Pressable>
      </ScrollView>

      <ModalProNotice
        visible={showProNotice}
        onClose={() => setShowProNotice(false)}
        onViewPlans={() => {
          setShowProNotice(false);
          router.push('/plan-selection');
        }}
      />

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Pressable 
                  style={styles.datePickerCancelButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerCancelText}>Cancel</Text>
                </Pressable>
                <Text style={styles.datePickerTitle}>Select Date</Text>
                <Pressable 
                  style={styles.datePickerDoneButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </Pressable>
              </View>
              
              <View style={styles.datePickerWheelContainer}>
                <View style={styles.datePickerWheel}>
                  <View style={styles.datePickerWheelColumn}>
                    <Text style={styles.datePickerWheelLabel}>Month</Text>
                                         <ScrollView 
                       ref={monthScrollRef}
                       style={styles.datePickerWheelScroll}
                       showsVerticalScrollIndicator={false}
                       snapToInterval={44}
                       decelerationRate="fast"
                     >
                      {[
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                      ].map((month, index) => (
                        <Pressable
                          key={month}
                          style={[
                            styles.datePickerWheelItem,
                            (formData.purchaseDate ? new Date(formData.purchaseDate).getMonth() : new Date().getMonth()) === index && styles.datePickerWheelItemSelected
                          ]}
                          onPress={() => {
                            const currentDate = formData.purchaseDate ? new Date(formData.purchaseDate) : new Date();
                            currentDate.setMonth(index);
                            setFormData({ ...formData, purchaseDate: currentDate.toISOString().split('T')[0] });
                          }}
                        >
                          <Text style={[
                            styles.datePickerWheelItemText,
                            (formData.purchaseDate ? new Date(formData.purchaseDate).getMonth() : new Date().getMonth()) === index && styles.datePickerWheelItemTextSelected
                          ]}>
                            {month}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                  
                  <View style={styles.datePickerWheelColumn}>
                    <Text style={styles.datePickerWheelLabel}>Day</Text>
                                         <ScrollView 
                       ref={dayScrollRef}
                       style={styles.datePickerWheelScroll}
                       showsVerticalScrollIndicator={false}
                       snapToInterval={44}
                       decelerationRate="fast"
                     >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <Pressable
                          key={day}
                          style={[
                            styles.datePickerWheelItem,
                            (formData.purchaseDate ? new Date(formData.purchaseDate).getDate() : new Date().getDate()) === day && styles.datePickerWheelItemSelected
                          ]}
                          onPress={() => {
                            const currentDate = formData.purchaseDate ? new Date(formData.purchaseDate) : new Date();
                            currentDate.setDate(day);
                            setFormData({ ...formData, purchaseDate: currentDate.toISOString().split('T')[0] });
                          }}
                        >
                          <Text style={[
                            styles.datePickerWheelItemText,
                            (formData.purchaseDate ? new Date(formData.purchaseDate).getDate() : new Date().getDate()) === day && styles.datePickerWheelItemTextSelected
                          ]}>
                            {day}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                  
                  <View style={styles.datePickerWheelColumn}>
                    <Text style={styles.datePickerWheelLabel}>Year</Text>
                                         <ScrollView 
                       ref={yearScrollRef}
                       style={styles.datePickerWheelScroll}
                       showsVerticalScrollIndicator={false}
                       snapToInterval={44}
                       decelerationRate="fast"
                     >
                      {Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <Pressable
                          key={year}
                          style={[
                            styles.datePickerWheelItem,
                            (formData.purchaseDate ? new Date(formData.purchaseDate).getFullYear() : new Date().getFullYear()) === year && styles.datePickerWheelItemSelected
                          ]}
                          onPress={() => {
                            const currentDate = formData.purchaseDate ? new Date(formData.purchaseDate) : new Date();
                            currentDate.setFullYear(year);
                            setFormData({ ...formData, purchaseDate: currentDate.toISOString().split('T')[0] });
                          }}
                        >
                          <Text style={[
                            styles.datePickerWheelItemText,
                            (formData.purchaseDate ? new Date(formData.purchaseDate).getFullYear() : new Date().getFullYear()) === year && styles.datePickerWheelItemTextSelected
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
          </View>
        </View>
      )}

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <View style={styles.categoryPickerModal}>
          <View style={styles.categoryPickerOverlay}>
            <View style={styles.categoryPickerContainer}>
              <View style={styles.categoryPickerHeader}>
                <Text style={styles.categoryPickerTitle}>Select Category</Text>
                <Pressable onPress={() => setShowCategoryPicker(false)}>
                  <Text style={styles.categoryPickerClose}>Done</Text>
                </Pressable>
              </View>
              
              <View style={styles.categoryPickerOptions}>
                {['Electronics', 'Cloth', 'Automotive', 'Other'].map((category) => (
                  <Pressable
                    key={category}
                    style={[
                      styles.categoryPickerOption,
                      formData.category === category && styles.categoryPickerOptionSelected
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, category });
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.categoryPickerOptionText,
                      formData.category === category && styles.categoryPickerOptionTextSelected
                    ]}>
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
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
    fontSize: theme.fontSize['2xl'],
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.neutral[900],
  },
  saveButton: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing['3xl'],
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
    marginBottom: theme.spacing.lg,
  },
  ocrContainer: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  ocrLeft: {
    flex: 1,
  },
  ocrHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.neutral[600],
  },
  ocrRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  proBadge: {
    backgroundColor: theme.colors.success[500],
    borderRadius: theme.borderRadius.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  proBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  toggle: {
    width: 44,
    height: 24,
    backgroundColor: theme.colors.neutral[300],
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: theme.colors.primary[600],
  },
  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    ...theme.shadows.sm,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    fontSize: theme.fontSize.base,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.lg,
  },
  warrantyPreview: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  warrantyPreviewLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.xs,
  },
  warrantyPreviewDate: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.success[500],
  },
  warrantyDurationHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.neutral[400],
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing['4xl'],
    ...theme.shadows.sm,
  },
  addButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.lg,
    minHeight: 56,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  datePickerButtonFocused: {
    borderColor: '#007AFF',
    borderWidth: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarIconContainer: {
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transform: [{ scale: 1 }],
  },
  calendarIconContainerFocused: {
    transform: [{ scale: 0.95 }],
  },
     datePickerText: {
     fontSize: theme.fontSize.base,
     color: theme.colors.neutral[900],
     flex: 1,
   },
  datePickerPlaceholder: {
    color: theme.colors.neutral[400],
  },
  datePickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 0,
    width: '100%',
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  datePickerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  datePickerCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  datePickerCancelText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#007AFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  datePickerDoneButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  datePickerDoneText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  datePickerRow: {
    gap: theme.spacing.sm,
  },
  datePickerLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.xs,
  },
  datePickerOptions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  datePickerOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    minWidth: 60,
    alignItems: 'center',
  },
  datePickerOptionSelected: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  datePickerOptionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[700],
  },
  datePickerOptionTextSelected: {
    color: theme.colors.white,
  },
  datePickerWheelContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  datePickerWheel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
  },
  datePickerWheelColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  datePickerWheelLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 12,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  datePickerWheelScroll: {
    maxHeight: 200,
  },
  datePickerWheelItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  datePickerWheelItemSelected: {
    backgroundColor: '#007AFF',
  },
  datePickerWheelItemText: {
    fontSize: 17,
    color: '#000000',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  datePickerWheelItemTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoryPickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.lg,
    minHeight: 56,
    width: '100%',
  },
  categoryPickerContent: {
    flex: 1,
  },
       categoryPickerText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[400],
  },
  categoryPickerTextPlaceholder: {
    color: theme.colors.neutral[400],
  },
  categoryPickerTextSelected: {
    color: theme.colors.neutral[900],
  },
  categoryPickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  categoryPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  categoryPickerContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: 500,
    ...theme.shadows.lg,
  },
  categoryPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  categoryPickerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
  },
  categoryPickerClose: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary[600],
  },
  categoryPickerOptions: {
    gap: theme.spacing.sm,
  },
  categoryPickerOption: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  categoryPickerOptionSelected: {
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
  },
  categoryPickerOptionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[900],
    textAlign: 'center',
  },
  categoryPickerOptionTextSelected: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
  },
  
   requiredNote: {
     fontSize: theme.fontSize.sm,
     color: theme.colors.neutral[500],
     textAlign: 'center',
     marginTop: theme.spacing.md,
     marginBottom: theme.spacing.sm,
     fontStyle: 'italic',
   },
 });