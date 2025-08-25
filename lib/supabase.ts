import { supabase } from './supabaseClient';

// Re-export the centralized client
export { supabase };

// Auth helper functions
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const onAuthStateChange = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
};

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:8081',
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    return { data, error };
  } catch (error: any) {
    console.error('Google OAuth Sign-In Error:', error);
    return { data: null, error };
  }
};

// Storage helper functions
export const uploadDeviceImage = async (file: File, deviceId: string, userId: string) => {
  try {
    console.log('Uploading device image:', { deviceId, userId, fileName: file.name });
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${userId}/${deviceId}_device.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('device-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('Upload successful:', data);
    return data;
  } catch (error) {
    console.error('Device image upload failed:', error);
    throw error;
  }
};

export const uploadReceiptImage = async (file: File, deviceId: string, userId: string) => {
  try {
    console.log('Uploading receipt image:', { deviceId, userId, fileName: file.name });
    
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${userId}/${deviceId}_receipt.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('receipt-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Receipt upload error:', error);
      throw error;
    }

    console.log('Receipt upload successful:', data);
    return data;
  } catch (error) {
    console.error('Receipt image upload failed:', error);
    throw error;
  }
};

// Delete functions for storage cleanup
export const deleteDeviceImage = async (deviceId: string, userId: string) => {
  try {
    console.log('Deleting device image:', { deviceId, userId });
    
    const { error } = await supabase.storage
      .from('device-images')
      .remove([`${userId}/${deviceId}_device.jpg`]);

    if (error) {
      console.error('Device image deletion error:', error);
      throw error;
    }

    console.log('Device image deleted successfully');
    return true;
  } catch (error) {
    console.error('Device image deletion failed:', error);
    throw error;
  }
};

export const deleteReceiptImage = async (deviceId: string, userId: string) => {
  try {
    console.log('Deleting receipt image:', { deviceId, userId });
    
    const { error } = await supabase.storage
      .from('receipt-images')
      .remove([`${userId}/${deviceId}_receipt.jpg`]);

    if (error) {
      console.error('Receipt deletion error:', error);
      throw error;
    }

    console.log('Receipt deleted successfully');
    return true;
  } catch (error) {
    console.error('Receipt deletion failed:', error);
    throw error;
  }
};

// Delete all images for a device
export const deleteDeviceImages = async (deviceId: string, userId: string) => {
  try {
    console.log('Deleting all images for device:', { deviceId, userId });
    
    // Delete both device and receipt images
    await Promise.all([
      deleteDeviceImage(deviceId, userId),
      deleteReceiptImage(deviceId, userId)
    ]);
    
    console.log('All device images deleted successfully');
    return true;
  } catch (error) {
    console.error('Failed to delete all device images:', error);
    throw error;
  }
};

// Rename temporary files to permanent ones after device creation
export const renameTempImages = async (tempDeviceId: string, permanentDeviceId: string, userId: string) => {
  try {
    console.log('Renaming temporary images:', { tempDeviceId, permanentDeviceId, userId });
    
    // List files in both buckets to find temp files
    const { data: deviceFiles } = await supabase.storage
      .from('device-images')
      .list(userId, { search: 'temp_device_' });
    
    const { data: receiptFiles } = await supabase.storage
      .from('receipt-images')
      .list(userId, { search: 'temp_receipt_' });
    
    console.log('Found temp device files:', deviceFiles?.map(f => f.name) || []);
    console.log('Found temp receipt files:', receiptFiles?.map(f => f.name) || []);
    
    // Rename device image if found - find the most recent temp file
    if (deviceFiles && deviceFiles.length > 0) {
      // Sort by creation time to get the most recent
      const sortedDeviceFiles = deviceFiles.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA; // Most recent first
      });
      
      const tempDeviceFile = sortedDeviceFiles[0];
      const oldPath = `${userId}/${tempDeviceFile.name}`;
      const newPath = `${userId}/${permanentDeviceId}_device.jpg`;
      
      console.log(`Renaming device image from ${tempDeviceFile.name} to ${permanentDeviceId}_device.jpg`);
      
      // Download and re-upload with new name
      const { data: fileData } = await supabase.storage
        .from('device-images')
        .download(oldPath);
      
      if (fileData) {
        const { error: uploadError } = await supabase.storage
          .from('device-images')
          .upload(newPath, fileData, { upsert: true });
        
        if (!uploadError) {
          // Delete old temp file
          await supabase.storage.from('device-images').remove([oldPath]);
          console.log('Device image renamed successfully');
        } else {
          console.error('Error uploading renamed device image:', uploadError);
        }
      }
    }
    
    // Rename receipt image if found - find the most recent temp file
    if (receiptFiles && receiptFiles.length > 0) {
      // Sort by creation time to get the most recent
      const sortedReceiptFiles = receiptFiles.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA; // Most recent first
      });
      
      const tempReceiptFile = sortedReceiptFiles[0];
      const oldPath = `${userId}/${tempReceiptFile.name}`;
      const newPath = `${userId}/${permanentDeviceId}_receipt.jpg`;
      
      console.log(`Renaming receipt image from ${tempReceiptFile.name} to ${permanentDeviceId}_receipt.jpg`);
      
      // Download and re-upload with new name
      const { data: fileData } = await supabase.storage
        .from('receipt-images')
        .download(oldPath);
      
      if (fileData) {
        const { error: uploadError } = await supabase.storage
          .from('receipt-images')
          .upload(newPath, fileData, { upsert: true });
        
        if (!uploadError) {
          // Delete old temp file
          await supabase.storage.from('receipt-images').remove([oldPath]);
          console.log('Receipt image renamed successfully');
        } else {
          console.error('Error uploading renamed receipt image:', uploadError);
        }
      }
    }
    
    console.log('All temporary images renamed successfully');
    return true;
  } catch (error) {
    console.error('Failed to rename temporary images:', error);
    throw error;
  }
};

// Clean up orphaned temporary files (older than 1 hour)
export const cleanupOrphanedTempFiles = async (userId: string) => {
  try {
    console.log('Cleaning up orphaned temporary files for user:', userId);
    
    // List all temp files in both buckets
    const { data: deviceFiles } = await supabase.storage
      .from('device-images')
      .list(userId, { search: 'temp_device_' });
    
    const { data: receiptFiles } = await supabase.storage
      .from('receipt-images')
      .list(userId, { search: 'temp_receipt_' });
    
    const filesToDelete: string[] = [];
    
    // Check device temp files (older than 1 hour)
    if (deviceFiles) {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      deviceFiles.forEach(file => {
        const timestamp = parseInt(file.name.replace('temp_device_', '').replace('.jpg', ''));
        if (timestamp < oneHourAgo) {
          filesToDelete.push(`${userId}/${file.name}`);
        }
      });
    }
    
    // Check receipt temp files (older than 1 hour)
    if (receiptFiles) {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      receiptFiles.forEach(file => {
        const timestamp = parseInt(file.name.replace('temp_receipt_', '').replace('.jpg', ''));
        if (timestamp < oneHourAgo) {
          filesToDelete.push(`${userId}/${file.name}`);
        }
      });
    }
    
    // Delete old temp files
    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('device-images')
        .remove(filesToDelete.filter(f => f.includes('temp_device_')));
      
      if (!deleteError) {
        console.log('Cleaned up old device temp files');
      }
      
      const { error: receiptDeleteError } = await supabase.storage
        .from('receipt-images')
        .remove(filesToDelete.filter(f => f.includes('temp_receipt_')));
      
      if (!receiptDeleteError) {
        console.log('Cleaned up old receipt temp files');
      }
    }
    
    console.log('Orphaned temp files cleanup completed');
    return true;
  } catch (error) {
    console.error('Failed to cleanup orphaned temp files:', error);
    throw error;
  }
};

export const getStorageUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};
