import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, Camera, Upload, X, Plus, ChevronDown } from 'lucide-react-native';
import { theme } from '@/src/styles/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AddDeviceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Form state
  const [deviceName, setDeviceName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
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
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showWarrantyDropdown, setShowWarrantyDropdown] = useState(false);

  const handleBackPress = () => {
    router.back();
  };

  const handleDeviceImageUpload = useCallback((imageUri: string) => {
    console.log('Device image uploaded:', imageUri);
    setDeviceImage(imageUri);
  }, []);

  const handleReceiptImageUpload = useCallback((imageUri: string) => {
    console.log('Receipt image uploaded:', imageUri);
    setReceiptImage(imageUri);
  }, []);

  const handleSubmit = async () => {
    if (!deviceName.trim()) {
      Alert.alert('Error', 'Device name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock device creation - no more Supabase
      const newDevice = {
        id: Date.now().toString(),
        name: deviceName,
        brand: brand || null,
        model: model || null,
        category: category || 'Other',
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
        purchase_date: purchaseDate || null,
        store_name: storeName || null,
        warranty_end_date: warrantyExpiryDate || null,
        notes: notes || null,
        image_url: deviceImage,
        receipt_url: receiptImage,
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
    if (purchaseDate && warrantyDuration) {
      const purchase = new Date(purchaseDate);
      const duration = warrantyDuration;
      
      let expiryDate = new Date(purchase);
      
      if (duration.includes('Month')) {
        const months = parseInt(duration.split(' ')[0]);
        expiryDate.setMonth(expiryDate.getMonth() + months);
      } else if (duration.includes('Year')) {
        const years = parseInt(duration.split(' ')[0]);
        expiryDate.setFullYear(expiryDate.getFullYear() + years);
      } else if (duration === 'Lifetime') {
        expiryDate = new Date('2099-12-31'); // Far future date
      }
      
      setWarrantyExpiryDate(expiryDate.toLocaleDateString());
    } else {
      setWarrantyExpiryDate('');
    }
  }, [purchaseDate, warrantyDuration]);

  const categories = [
    'Electronics',
    'Automotive',
    'Clothing',
    'Home & Garden',
    'Sports & Recreation',
    'Other'
  ];

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
        <Pressable onPress={handleBackPress}>
          <ArrowLeft size={24} color={theme.colors.neutral[900]} />
        </Pressable>
        <Text style={styles.headerTitle}>Add New Device</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Device Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Device Name *</Text>
            <TextInput
              style={styles.textInput}
              value={deviceName}
              onChangeText={setDeviceName}
              placeholder="e.g., iPhone 15, Samsung TV"
              placeholderTextColor={theme.colors.neutral[400]}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: theme.spacing.sm }]}>
              <Text style={styles.inputLabel}>Brand</Text>
              <TextInput
                style={styles.textInput}
                value={brand}
                onChangeText={setBrand}
                placeholder="e.g., Apple, Samsung"
                placeholderTextColor={theme.colors.neutral[400]}
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Model</Text>
              <TextInput
                style={styles.textInput}
                value={model}
                onChangeText={setModel}
                placeholder="e.g., Pro Max, QLED"
                placeholderTextColor={theme.colors.neutral[400]}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.dropdownContainer}>
              <Pressable 
                style={styles.dropdownButton}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <Text style={[styles.dropdownText, !category && styles.dropdownPlaceholder]}>
                  {category || 'Choose category'}
                </Text>
                <ChevronDown size={20} color={theme.colors.neutral[400]} />
              </Pressable>
              
              <View style={[
                styles.dropdownOptions,
                { opacity: showCategoryDropdown ? 1 : 0, height: showCategoryDropdown ? 'auto' : 0 }
              ]}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Purchase Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purchase Information</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: theme.spacing.sm }]}>
              <Text style={styles.inputLabel}>Purchase Price</Text>
              <TextInput
                style={styles.textInput}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                placeholder="0.00"
                placeholderTextColor={theme.colors.neutral[400]}
                keyboardType="numeric"
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Purchase Date</Text>
              <TextInput
                style={styles.textInput}
                value={purchaseDate}
                onChangeText={setPurchaseDate}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={theme.colors.neutral[400]}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Store Name</Text>
            <TextInput
              style={styles.textInput}
              value={storeName}
              onChangeText={setStoreName}
              placeholder="e.g., Best Buy, Amazon"
              placeholderTextColor={theme.colors.neutral[400]}
            />
          </View>
        </View>

        {/* Warranty Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warranty Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Warranty Duration</Text>
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

        {/* Device Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Photo</Text>
          <View style={styles.uploadZone}>
            <View style={styles.uploadContent}>
              {deviceImage ? (
                <>
                  <Camera size={32} color={theme.colors.success[500]} />
                  <Text style={styles.uploadSuccessText}>Photo added successfully</Text>
                  <Pressable style={styles.changePhotoButton} onPress={() => setDeviceImage(null)}>
                    <Text style={styles.changePhotoText}>Change photo</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Camera size={32} color={theme.colors.neutral[400]} />
                  <Text style={styles.uploadText}>Take a photo or choose from library</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Add Receipt Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Receipt</Text>
          <View style={styles.uploadZone}>
            <View style={styles.uploadContent}>
              {receiptImage ? (
                <>
                  <Camera size={32} color={theme.colors.success[500]} />
                  <Text style={styles.uploadSuccessText}>Receipt added successfully</Text>
                  <Pressable style={styles.changePhotoButton} onPress={() => setReceiptImage(null)}>
                    <Text style={styles.changePhotoText}>Change receipt</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Camera size={32} color={theme.colors.neutral[400]} />
                  <Text style={styles.uploadText}>Take a photo or add from library</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any additional information about your device..."
              placeholderTextColor={theme.colors.neutral[400]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
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
    fontSize: theme.fontSize.base,
    backgroundColor: theme.colors.white,
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
  uploadZone: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
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
});