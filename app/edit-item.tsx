import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView, ActivityIndicator, Switch, Image, Modal, Dimensions } from 'react-native';
import { ArrowLeft, Camera, Lightbulb, ChevronDown, Calendar, FolderOpen } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { iosColors, iosFonts, iosSpacing, iosRadius } from '@/src/styles/iosDesignSystem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { useDeviceSync } from '@/src/hooks/useDeviceSync';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDeviceUpload } from '@/src/hooks/useDeviceUpload';
import { AddDeviceFormData, DeviceFileData } from '@/src/types/device';


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
  
  // Feature toggles
  const [autoReceiptExtraction, setAutoReceiptExtraction] = useState(false);
  
  // Loading state - now managed by sync system
  const isSubmitting = isStoring;
  
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
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'device') {
          setDeviceImage(result.assets[0].uri);
        } else {
          setReceiptImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
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
    
    console.log('Validation passed, storing device locally first...');
    
    try {
      // Step 1: Store device locally immediately for instant UI update
      const localDeviceData = {
        id: `temp_${Date.now()}`, // Temporary ID until Supabase sync
        user_id: user.id,
        name: deviceName.trim(),
        supplier: storeName.trim(),
        category: selectedCategory || '',
        purchase_date: selectedDate.toISOString().split('T')[0],
        warranty_months: parseInt(warrantyDuration),
        warranty_end_date: new Date(selectedDate.getTime() + (parseInt(warrantyDuration) * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        location: null,
        photo_irl: deviceImage || null,
        notes: notes || null,
        invoice_url: receiptImage || null,
        identifiers: serialNumber.trim() || null,
        created_at: new Date().toISOString(),
        sync_status: 'pending' as const,
        local_id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      console.log('Storing device locally:', localDeviceData);
      
      // Import and use DeviceLocalStorage to store immediately
      const { DeviceLocalStorage } = await import('@/src/lib/localStorage');
      await DeviceLocalStorage.storeDevice(localDeviceData);
      
      console.log('✅ Device stored locally successfully');
      
      // Step 2: Navigate to dashboard with refresh parameter
      console.log('Navigating to dashboard with refresh parameter...');
      router.push({
        pathname: '/',
        params: { refresh: 'true', timestamp: Date.now().toString() }
      });
      
      // Step 3: Continue with background upload
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
      };
      
      console.log('Form data prepared for background upload:', formData);

      // Prepare file data for background upload
      const fileData: DeviceFileData = {
        devicePhoto: deviceImage ? {
          uri: deviceImage,
          name: 'device-photo.jpg',
          type: 'image/jpeg'
      } : undefined,
        receiptPhoto: receiptImage ? {
          uri: receiptImage,
          name: 'receipt-photo.jpg',
          type: 'image/jpeg'
        } : undefined,
        additionalPhotos: undefined,
      };
      
      console.log('File data prepared for background upload:', fileData);

      // Upload the device in background (no await)
      uploadDevice(formData, fileData).then(result => {
        console.log('Background upload result:', result);
        if (result.success) {
          console.log('✅ Background upload completed successfully');
          // Could show a success toast notification here
        } else {
          console.log('❌ Background upload failed:', result.error);
          // Could show an error toast notification here
        }
      }).catch(error => {
        console.error('Background upload error:', error);
        // Could show an error toast notification here
      });
      
    } catch (error) {
      console.error('Error storing device locally:', error);
      Alert.alert('Error', 'Failed to store item locally. Please try again.');
    }
  };

           // Calculate warranty expiry date when purchase date or warranty duration changes
    useEffect(() => {
      if (selectedDate && warrantyDuration) {
        const purchase = new Date(selectedDate);
        const duration = parseInt(warrantyDuration);
        
        if (!isNaN(duration)) {
          let expiryDate = new Date(purchase);
          expiryDate.setMonth(expiryDate.getMonth() + duration);
          setWarrantyExpiryDate(expiryDate.toLocaleDateString());
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
                   <ArrowLeft size={20} color={theme.colors.neutral[600]} />
                 </Pressable>
        <Text style={styles.headerTitle}>Add Item</Text>
        <View style={styles.headerActions} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        

        
        {/* Compression Status */}
        {compressionStatus && (
          <View style={styles.compressionStatus}>
            <ActivityIndicator size="small" color={theme.colors.primary[600]} />
            <Text style={styles.compressionStatusText}>{compressionStatus}</Text>
          </View>
        )}
        
        {/* Item Photo Section */}
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Item Photo</Text>
                       {deviceImage ? (
              <View style={styles.imagePreviewContainer}>
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: deviceImage }} style={styles.imagePreview} />
                  <Pressable 
                    style={styles.removeImageButton} 
                    onPress={() => setDeviceImage(null)}
                  >
                    <Text style={styles.removeImageButtonText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
             <View style={styles.uploadRow}>
               <Pressable style={styles.uploadZone} onPress={() => pickImage('device')}>
                 <View style={styles.uploadContent}>
                   <Camera size={32} color={theme.colors.neutral[400]} />
                   <Text style={styles.uploadText}>Take a photo</Text>
                 </View>
               </Pressable>
               <Pressable style={styles.uploadZone} onPress={() => pickImage('device')}>
                 <View style={styles.uploadContent}>
                   <FolderOpen size={32} color={theme.colors.neutral[400]} />
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
                  <Pressable 
                    style={styles.removeImageButton} 
                    onPress={() => setReceiptImage(null)}
                  >
                    <Text style={styles.removeImageButtonText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
             <View style={styles.uploadRow}>
                               <Pressable style={styles.uploadZone} onPress={() => pickImage('receipt')}>
                  <View style={styles.uploadContent}>
                    <Camera size={32} color={theme.colors.neutral[400]} />
                    <Text style={styles.uploadText}>Take a photo</Text>
                  </View>
                </Pressable>
                <Pressable style={styles.uploadZone} onPress={() => pickImage('receipt')}>
                  <View style={styles.uploadContent}>
                    <FolderOpen size={32} color={theme.colors.neutral[400]} />
                    <Text style={styles.uploadText}>Add from library</Text>
                  </View>
                </Pressable>
              </View>
            )}
          
          {/* PRO Feature Toggle */}
          <View style={styles.proFeatureRow}>
            <View style={styles.proFeatureInfo}>
              <Lightbulb size={20} color="#FFD700" />
              <Text style={styles.proFeatureText}>Auto receipt extraction</Text>
            </View>
            <Text style={styles.proBadge}>PRO</Text>
                         <Switch
               value={autoReceiptExtraction}
               onValueChange={setAutoReceiptExtraction}
               trackColor={{ false: '#E5E5EA', true: '#E5E5EA' }}
               thumbColor={autoReceiptExtraction ? '#10B981' : '#FF3B30'}
               ios_backgroundColor="#E5E5EA"
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
               placeholderTextColor="#8E8E93"
             />
          </View>

                     <View style={styles.inputGroup}>
                          <TextInput
                style={styles.textInput}
                value={brand}
                onChangeText={setBrand}
                placeholder="Enter brand name"
                placeholderTextColor="#8E8E93"
              />
           </View>

                      <View style={styles.inputGroup}>
                         <TextInput
               style={styles.textInput}
               value={serialNumber}
               onChangeText={setSerialNumber}
               placeholder="Enter serial number"
               placeholderTextColor="#8E8E93"
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
               <ChevronDown size={20} color="#999" />
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
               <Calendar size={20} color="#999" />
             </Pressable>
           </View>

          <View style={styles.inputGroup}>
                         <TextInput
               style={styles.textInput}
               value={purchasePrice}
               onChangeText={setPurchasePrice}
               placeholder="Purchase price"
               placeholderTextColor="#8E8E93"
               keyboardType="numeric"
             />
          </View>

          <View style={styles.inputGroup}>
                         <TextInput
               style={styles.textInput}
               value={storeName}
               onChangeText={setStoreName}
               placeholder="Enter store name"
               placeholderTextColor="#8E8E93"
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
               placeholderTextColor="#8E8E93"
               keyboardType="numeric"
             />
           </View>

                     <View style={styles.warrantyExpiryInfo}>
                           {warrantyExpiryDate ? (
                             <View style={styles.warrantyStatusRow}>
                               <View style={[
                                 styles.warrantyBadge,
                                 { backgroundColor: new Date(warrantyExpiryDate) < new Date() ? iosColors.systemRed : '#10b981' }
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
              placeholderTextColor="#8E8E93"
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
    fontSize: iosFonts.title1,
    fontWeight: iosFonts.bold,
    color: iosColors.label,
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
    fontSize: iosFonts.title3,
    fontWeight: iosFonts.semibold,
    color: iosColors.label,
    marginBottom: iosSpacing.lg,
  },
  inputGroup: {
    marginBottom: iosSpacing.lg,
  },
  inputLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.xs,
  },
           textInput: {
      borderWidth: 1,
      borderColor: iosColors.systemGray5,
      borderRadius: iosRadius.md,
      paddingHorizontal: iosSpacing.lg,
      paddingVertical: iosSpacing.lg,
      fontSize: iosFonts.body,
      color: iosColors.label,
      backgroundColor: iosColors.systemBackground,
      shadowColor: iosColors.label,
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
    backgroundColor: theme.colors.primary[600],
    borderColor: theme.colors.primary[600],
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
    backgroundColor: iosColors.systemBlue,
    borderRadius: iosRadius.md,
    paddingVertical: iosSpacing.lg,
    alignItems: 'center',
    marginTop: iosSpacing.xl,
    marginBottom: iosSpacing.xxxl,
    shadowColor: iosColors.label,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: iosFonts.body,
    fontWeight: iosFonts.semibold,
    color: iosColors.systemBackground,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  bottomSpacing: {
    height: iosSpacing.xxxl,
  },
           dropdownContainer: {
      position: 'relative',
      borderWidth: 1,
      borderColor: iosColors.systemGray5,
      borderRadius: iosRadius.md,
      overflow: 'hidden',
      shadowColor: iosColors.label,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
     dropdownButton: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: iosSpacing.lg,
     paddingVertical: iosSpacing.lg,
     backgroundColor: iosColors.systemBackground,
   },
     dropdownText: {
     fontSize: iosFonts.body,
     color: iosColors.label,
   },
     dropdownPlaceholder: {
     color: iosColors.placeholderText,
   },
     dropdownOptions: {
     position: 'absolute',
     top: '100%',
     left: 0,
     right: 0,
     backgroundColor: iosColors.systemBackground,
     borderWidth: 1,
     borderColor: iosColors.systemGray5,
     borderRadius: iosRadius.md,
     overflow: 'hidden',
     zIndex: 1,
   },
     dropdownOption: {
     paddingHorizontal: iosSpacing.lg,
     paddingVertical: iosSpacing.lg,
     borderBottomWidth: 1,
     borderBottomColor: iosColors.systemGray6,
   },
     dropdownOptionText: {
     fontSize: iosFonts.body,
     color: iosColors.label,
   },
           uploadRow: {
      flexDirection: 'row',
      gap: iosSpacing.md,
    },
       uploadZone: {
      flex: 1,
      backgroundColor: iosColors.systemGray6,
      borderRadius: iosRadius.md,
      padding: iosSpacing.lg,
      borderWidth: 1,
      borderColor: iosColors.systemGray5,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
      shadowColor: iosColors.label,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
       imagePreviewContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
      shadowColor: iosColors.label,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
       imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: iosRadius.md,
    },
   imageWrapper: {
     position: 'relative',
     width: '100%',
   },
               removeImageButton: {
       position: 'absolute',
       top: -11,
       right: -8,
       width: 24,
       height: 24,
       borderRadius: iosRadius.pill,
       backgroundColor: iosColors.systemRed,
       alignItems: 'center',
       justifyContent: 'center',
       shadowColor: iosColors.label,
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.25,
       shadowRadius: 4,
       elevation: 5,
     },
               removeImageButtonText: {
       color: iosColors.systemBackground,
       fontSize: iosFonts.callout,
       fontWeight: iosFonts.semibold,
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
     fontSize: iosFonts.body,
     color: iosColors.systemGray,
     marginTop: iosSpacing.sm,
     textAlign: 'center',
   },
     uploadSuccessText: {
     fontSize: iosFonts.body,
     color: iosColors.systemGreen,
     marginTop: iosSpacing.sm,
   },
     changePhotoButton: {
     marginTop: iosSpacing.sm,
   },
     changePhotoText: {
     fontSize: iosFonts.footnote,
     color: iosColors.systemBlue,
     textDecorationLine: 'underline',
   },
                       warrantyExpiryInfo: {
       backgroundColor: iosColors.systemBackground,
       borderRadius: iosRadius.md,
       padding: iosSpacing.lg,
       borderWidth: 1,
       borderColor: iosColors.systemGray5,
       minHeight: 60,
       flexDirection: 'row',
       alignItems: 'center',
       justifyContent: 'center',
       shadowColor: iosColors.label,
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.08,
       shadowRadius: 8,
       elevation: 3,
     },
       warrantyExpiryLabel: {
      fontSize: iosFonts.body,
      fontWeight: iosFonts.medium,
      color: iosColors.systemGreen,
    },
            warrantyExpiredText: {
      color: iosColors.systemRed,
    },
     warrantyStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: iosSpacing.md,
    },
     warrantyBadge: {
      paddingHorizontal: iosSpacing.sm,
      paddingVertical: iosSpacing.xs,
      borderRadius: iosRadius.sm,
      minWidth: 60,
      alignItems: 'center',
    },
     warrantyBadgeText: {
      fontSize: iosFonts.footnote,
      fontWeight: iosFonts.semibold,
      color: iosColors.systemBackground,
    },
     warrantyDateText: {
      fontSize: iosFonts.body,
      fontWeight: iosFonts.medium,
      color: iosColors.label,
    },
     warrantyPlaceholderText: {
      fontSize: iosFonts.body,
      fontWeight: iosFonts.medium,
      color: iosColors.placeholderText,
    },
     backButton: {
     flexDirection: 'row',
     alignItems: 'center',
     marginRight: iosSpacing.sm,
   },
     backText: {
     fontSize: iosFonts.body,
     color: iosColors.systemGray,
     marginLeft: iosSpacing.xs,
   },
  saveButtonText: {
    fontSize: iosFonts.body,
    fontWeight: iosFonts.semibold,
    color: iosColors.systemBlue,
  },
                                               proFeatureRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: iosSpacing.lg,
          paddingHorizontal: iosSpacing.lg,
          paddingVertical: iosSpacing.lg,
          backgroundColor: iosColors.systemBackground,
          borderRadius: iosRadius.md,
          shadowColor: iosColors.label,
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
     fontSize: iosFonts.body,
     color: iosColors.systemGray,
     marginLeft: iosSpacing.sm,
   },
     proBadge: {
     backgroundColor: 'transparent',
     paddingHorizontal: iosSpacing.xs,
     paddingVertical: iosSpacing.xs,
     marginLeft: 'auto',
     marginRight: iosSpacing.md,
     fontSize: iosFonts.footnote,
     fontWeight: iosFonts.semibold,
     color: iosColors.systemGreen,
     letterSpacing: 0.3,
   },
  
           dateInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: iosColors.systemGray5,
      borderRadius: iosRadius.md,
      paddingHorizontal: iosSpacing.lg,
      paddingVertical: iosSpacing.lg,
      backgroundColor: iosColors.systemBackground,
      shadowColor: iosColors.label,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
           dateInput: {
      flex: 1,
      paddingRight: iosSpacing.sm,
      fontSize: iosFonts.body,
      color: iosColors.label,
    },
   
       // Apple-style picker styles
         categoryButton: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       borderWidth: 1,
       borderColor: iosColors.systemGray5,
       borderRadius: iosRadius.md,
       paddingHorizontal: iosSpacing.lg,
       paddingVertical: iosSpacing.lg,
       backgroundColor: iosColors.systemBackground,
       shadowColor: iosColors.label,
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.08,
       shadowRadius: 8,
       elevation: 3,
     },
       categoryButtonText: {
      fontSize: iosFonts.body,
      color: iosColors.label,
    },
       categoryPlaceholder: {
      color: iosColors.placeholderText,
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
      backgroundColor: iosColors.secondarySystemBackground,
      borderTopLeftRadius: iosRadius.xl,
      borderTopRightRadius: iosRadius.xl,
      paddingBottom: iosSpacing.safeBottom, // Safe area bottom
    },
       pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: iosSpacing.lg,
      paddingVertical: iosSpacing.lg,
      backgroundColor: iosColors.systemBackground,
      borderTopLeftRadius: iosRadius.xl,
      borderTopRightRadius: iosRadius.xl,
      borderBottomWidth: 0.5,
      borderBottomColor: iosColors.systemGray3,
    },
       cancelButton: {
      fontSize: iosFonts.body,
      color: iosColors.systemBlue,
    },
       pickerTitle: {
      fontSize: iosFonts.body,
      fontWeight: iosFonts.semibold,
      color: iosColors.label,
    },
       doneButton: {
      fontSize: iosFonts.body,
      color: iosColors.systemBlue,
      fontWeight: iosFonts.semibold,
    },
               pickerWheel: {
       paddingVertical: iosSpacing.xl,
       paddingHorizontal: iosSpacing.sm,
     },
               pickerOption: {
       paddingHorizontal: iosSpacing.lg,
       paddingVertical: iosSpacing.lg,
       alignItems: 'center',
       backgroundColor: 'transparent',
       borderRadius: iosRadius.md,
       marginHorizontal: iosSpacing.sm,
       marginVertical: iosSpacing.xs,
     },
               pickerOptionSelected: {
       backgroundColor: iosColors.systemBlue,
       borderRadius: iosRadius.md,
       marginHorizontal: iosSpacing.sm,
       marginVertical: iosSpacing.xs,
     },
       pickerOptionText: {
      fontSize: iosFonts.title3,
      color: iosColors.label,
      fontWeight: iosFonts.regular,
    },
       pickerOptionTextSelected: {
      color: iosColors.systemBackground,
      fontWeight: iosFonts.semibold,
    },

       // Date picker styles
         dateButton: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       borderWidth: 1,
       borderColor: iosColors.systemGray5,
       borderRadius: iosRadius.md,
       paddingHorizontal: iosSpacing.lg,
       paddingVertical: iosSpacing.lg,
       backgroundColor: iosColors.systemBackground,
       shadowColor: iosColors.label,
       shadowOffset: { width: 0, height: 2 },
       shadowOpacity: 0.08,
       shadowRadius: 8,
       elevation: 3,
     },
       dateButtonText: {
      fontSize: iosFonts.body,
      color: iosColors.label,
    },
       datePlaceholder: {
      color: iosColors.placeholderText,
    },
       datePickerContainer: {
      backgroundColor: iosColors.secondarySystemBackground,
      borderTopLeftRadius: iosRadius.xl,
      borderTopRightRadius: iosRadius.xl,
      paddingBottom: iosSpacing.safeBottom,
      maxHeight: '60%',
    },
       dateWheelContainer: {
      flexDirection: 'row',
      paddingVertical: iosSpacing.xl,
      paddingHorizontal: iosSpacing.xl,
    },
               wheelColumn: {
       flex: 1,
       height: 200, // Fixed height for scrollable area
       marginHorizontal: iosSpacing.xs,
     },
    wheelScrollContent: {
      paddingVertical: 0, // Remove padding to allow proper alignment
    },
    wheelScrollView: {
      maxHeight: 200,
    },
               wheelOption: {
       height: iosSpacing.minTouch,
       justifyContent: 'center',
       alignItems: 'center',
       borderRadius: iosRadius.sm,
       marginVertical: 1,
       paddingHorizontal: iosSpacing.md,
     },
       wheelOptionSelected: {
      backgroundColor: iosColors.systemBlue,
    },
       wheelOptionText: {
      fontSize: iosFonts.title3,
      color: iosColors.label,
      fontWeight: iosFonts.regular,
    },
               wheelOptionTextSelected: {
      color: iosColors.systemBackground,
      fontWeight: iosFonts.semibold,
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



 
  });