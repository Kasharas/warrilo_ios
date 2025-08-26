import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView, ActivityIndicator, Switch, Image, Modal, Dimensions } from 'react-native';
import { ArrowLeft, Camera, Lightbulb, ChevronDown, Calendar, FolderOpen } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';

export default function AddDeviceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
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
  const [modelNumber, setModelNumber] = useState('');
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
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!deviceName.trim()) {
      Alert.alert('Error', 'Device name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock device creation
             const newDevice = {
         id: Date.now().toString(),
         name: deviceName,
         brand: brand || null,
         modelNumber: modelNumber || null,
         serialNumber: serialNumber || null,
         category: selectedCategory || 'Other',
         purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
                 purchase_date: selectedDate ? selectedDate.toISOString().split('T')[0] : null,
        store_name: storeName || null,
        warranty_duration: warrantyDuration || null,
        warranty_end_date: warrantyExpiryDate || null,
        notes: notes || null,
        image_url: deviceImage,
        receipt_url: receiptImage,
        auto_receipt_extraction: autoReceiptExtraction,
        user_id: user?.id,
        created_at: new Date().toISOString(),
      };

      console.log('Device created (mock):', newDevice);
      
      Alert.alert(
        'Success!',
        'Device added successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error adding device:', error);
      Alert.alert('Error', 'Failed to add device. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

     // Calculate warranty expiry date when purchase date or warranty duration changes
   useEffect(() => {
     if (selectedDate && warrantyDuration) {
       const purchase = new Date(selectedDate);
       const duration = warrantyDuration;
       
       let expiryDate = new Date(purchase);
       
       if (duration.includes('Month')) {
         const months = parseInt(duration.split(' ')[0]);
         expiryDate.setMonth(expiryDate.getMonth() + months);
       } else if (duration.includes('Year')) {
         const years = parseInt(duration.split(' ')[0]);
         expiryDate.setFullYear(expiryDate.getFullYear() + years);
       } else if (duration === 'Lifetime') {
         expiryDate = new Date('2099-12-31');
       }
       
       setWarrantyExpiryDate(expiryDate.toLocaleDateString());
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
        <Text style={styles.headerTitle}>Add Device</Text>
        <Pressable style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                          {/* Device Photo Section */}
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Device Photo</Text>
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
              trackColor={{ false: theme.colors.neutral[200], true: theme.colors.primary[600] }}
              thumbColor={theme.colors.white}
            />
          </View>
        </View>

        {/* Device Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          
          <View style={styles.inputGroup}>
                         <TextInput
               style={styles.textInput}
               value={deviceName}
               onChangeText={setDeviceName}
               placeholder="Enter device name"
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
            <View style={styles.dropdownContainer}>
              <Pressable 
                style={styles.dropdownButton}
                onPress={() => setShowWarrantyDropdown(!showWarrantyDropdown)}
              >
                <Text style={[styles.dropdownText, !warrantyDuration && styles.dropdownPlaceholder]}>
                  {warrantyDuration || 'Choose duration'}
                </Text>
                <ChevronDown size={20} color={theme.colors.neutral[400]} />
              </Pressable>
              
              <View style={[
                styles.dropdownOptions,
                { opacity: showWarrantyDropdown ? 1 : 0, height: showWarrantyDropdown ? 'auto' : 0 }
              ]}>
                {warrantyDurations.map((duration) => (
                  <Pressable
                    key={duration}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setWarrantyDuration(duration);
                      setShowWarrantyDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{duration}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.warrantyExpiryInfo}>
            <Text style={styles.warrantyExpiryLabel}>Warranty expires on</Text>
            <Text style={[
              styles.warrantyExpiryDate,
              !warrantyExpiryDate && styles.warrantyExpiryPlaceholder
            ]}>
              {warrantyExpiryDate || 'Select purchase date and duration'}
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Add Device</Text>
          )}
        </Pressable>

                 <View style={styles.bottomSpacing} />
         
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
                       tempSelectedCategory === cat && styles.pickerOptionSelected
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
       </ScrollView>
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
     fontSize: 17,
     color: '#000',
     backgroundColor: theme.colors.white,
     shadowColor: theme.colors.neutral[900],
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.06,
     shadowRadius: 4,
     elevation: 2,
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
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing['4xl'],
    ...theme.shadows.sm,
  },
  submitButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  bottomSpacing: {
    height: theme.spacing['4xl'],
  },
     dropdownContainer: {
     position: 'relative',
     borderWidth: 1,
     borderColor: theme.colors.neutral[200],
     borderRadius: theme.borderRadius.md,
     overflow: 'hidden',
     shadowColor: theme.colors.neutral[900],
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
    backgroundColor: theme.colors.white,
  },
  dropdownText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[700],
  },
  dropdownPlaceholder: {
    color: theme.colors.neutral[400],
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
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
    borderBottomColor: theme.colors.neutral[100],
  },
  dropdownOptionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[700],
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
     shadowColor: theme.colors.neutral[900],
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.08,
     shadowRadius: 8,
     elevation: 3,
   },
   imagePreviewContainer: {
     alignItems: 'center',
     justifyContent: 'center',
     minHeight: 120,
     shadowColor: theme.colors.neutral[900],
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
       removeImageButton: {
      position: 'absolute',
      top: -11,
      right: -8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#FF3B30',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
       removeImageButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
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
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[400],
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  uploadSuccessText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.success[500],
    marginTop: theme.spacing.sm,
  },
  changePhotoButton: {
    marginTop: theme.spacing.sm,
  },
  changePhotoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[600],
    textDecorationLine: 'underline',
  },
     warrantyExpiryInfo: {
     backgroundColor: theme.colors.neutral[50],
     borderRadius: theme.borderRadius.md,
     padding: theme.spacing.lg,
     borderWidth: 1,
     borderColor: theme.colors.neutral[200],
     minHeight: 80,
     alignItems: 'center',
     justifyContent: 'center',
     shadowColor: theme.colors.neutral[900],
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.08,
     shadowRadius: 8,
     elevation: 3,
   },
  warrantyExpiryLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.neutral[600],
    marginBottom: theme.spacing.xs,
  },
  warrantyExpiryDate: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.neutral[900],
  },
  warrantyExpiryPlaceholder: {
    color: theme.colors.neutral[400],
    fontWeight: theme.fontWeight.normal,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  backText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
    marginLeft: theme.spacing.xs,
  },
  saveButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary[600],
  },
                       proFeatureRow: {
         flexDirection: 'row',
         justifyContent: 'space-between',
         alignItems: 'center',
         marginTop: theme.spacing.lg,
         paddingHorizontal: theme.spacing.lg,
         paddingVertical: theme.spacing.lg,
         backgroundColor: theme.colors.neutral[50],
         borderRadius: theme.borderRadius.md,
       },
  proFeatureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proFeatureText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.neutral[600],
    marginLeft: theme.spacing.sm,
  },
  proBadge: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    marginLeft: 'auto',
    marginRight: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: '#22C55E',
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
     backgroundColor: theme.colors.white,
     shadowColor: theme.colors.neutral[900],
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.06,
     shadowRadius: 4,
     elevation: 2,
   },
     dateInput: {
     flex: 1,
     paddingRight: theme.spacing.sm,
     fontSize: 17,
     color: '#000',
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
      backgroundColor: theme.colors.white,
      shadowColor: theme.colors.neutral[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
   categoryButtonText: {
     fontSize: 17,
     color: '#000',
   },
   categoryPlaceholder: {
     color: '#8E8E93',
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
     backgroundColor: '#F2F2F7',
     borderTopLeftRadius: 16,
     borderTopRightRadius: 16,
     paddingBottom: 34, // Safe area bottom
   },
   pickerHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     paddingHorizontal: 16,
     paddingVertical: 16,
     backgroundColor: '#FFFFFF',
     borderTopLeftRadius: 16,
     borderTopRightRadius: 16,
     borderBottomWidth: 0.5,
     borderBottomColor: '#C7C7CC',
   },
   cancelButton: {
     fontSize: 17,
     color: '#007AFF',
   },
   pickerTitle: {
     fontSize: 17,
     fontWeight: '600',
     color: '#000',
   },
   doneButton: {
     fontSize: 17,
     color: '#007AFF',
     fontWeight: '600',
   },
   pickerWheel: {
     paddingVertical: 20,
   },
   pickerOption: {
     paddingHorizontal: 16,
     paddingVertical: 16,
     alignItems: 'center',
     backgroundColor: 'transparent',
   },
   pickerOptionSelected: {
     backgroundColor: '#007AFF',
   },
   pickerOptionText: {
     fontSize: 20,
     color: '#000',
     fontWeight: '400',
   },
   pickerOptionTextSelected: {
     color: '#FFFFFF',
     fontWeight: '600',
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
      backgroundColor: theme.colors.white,
      shadowColor: theme.colors.neutral[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
   dateButtonText: {
     fontSize: 17,
     color: '#000',
   },
   datePlaceholder: {
     color: '#8E8E93',
   },
   datePickerContainer: {
     backgroundColor: '#F2F2F7',
     borderTopLeftRadius: 16,
     borderTopRightRadius: 16,
     paddingBottom: 34,
     maxHeight: '60%',
   },
   dateWheelContainer: {
     flexDirection: 'row',
     paddingVertical: 20,
     paddingHorizontal: 20,
   },
       wheelColumn: {
      flex: 1,
      height: 200, // Fixed height for scrollable area
      marginHorizontal: 5,
    },
    wheelScrollContent: {
      paddingVertical: 0, // Remove padding to allow proper alignment
    },
    wheelScrollView: {
      maxHeight: 200,
    },
       wheelOption: {
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      marginVertical: 1,
      paddingHorizontal: 10,
    },
   wheelOptionSelected: {
     backgroundColor: '#007AFF',
   },
   wheelOptionText: {
     fontSize: 20,
     color: '#000',
     fontWeight: '400',
   },
   wheelOptionTextSelected: {
     color: '#FFFFFF',
     fontWeight: '600',
   },
 
  });