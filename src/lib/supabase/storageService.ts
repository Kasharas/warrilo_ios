import { supabase } from '../../../lib/supabaseClient';
import { compressDevicePhoto, compressReceipt } from '../imageCompression';

// Updated device photo upload with compression
export const uploadDevicePhoto = async (photoUri: string, userId: string): Promise<string | null> => {
  if (!photoUri) return null;
  
  try {
    console.log('Compressing device photo...');
    const compressedImage = await compressDevicePhoto(photoUri);
    
    console.log('Original size vs compressed size comparison');
    console.log('Compressed image ready for upload');
    
    // Convert compressed base64 to blob
    const blob = await dataURLtoBlob(compressedImage.compressedUri!);
    
    const fileName = `${userId}/${Date.now()}-device-${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    const { error } = await supabase.storage
      .from('device-photos')
      .upload(fileName, blob);
      
    if (error) throw error;
    
    const { data } = supabase.storage
      .from('device-photos')
      .getPublicUrl(fileName);
      
    return data.publicUrl;
  } catch (error) {
    throw new Error(`Photo compression/upload failed: ${error.message}`);
  }
};

// Updated receipt upload with compression  
export const uploadReceipt = async (receiptUri: string, userId: string): Promise<string> => {
  if (!receiptUri) throw new Error('Receipt is required');
  
  try {
    console.log('Compressing receipt...');
    const compressedImage = await compressReceipt(receiptUri);
    
    console.log('Compressed receipt ready for upload');
    
    const blob = await dataURLtoBlob(compressedImage.compressedUri!);
    
    const fileName = `${userId}/${Date.now()}-invoice-${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    const { error } = await supabase.storage
      .from('device-invoices')
      .upload(fileName, blob);
      
    if (error) throw error;
    
    const { data } = supabase.storage
      .from('device-invoices')
      .getPublicUrl(fileName);
      
    return data.publicUrl;
  } catch (error) {
    throw new Error(`Receipt compression/upload failed: ${error.message}`);
  }
};

// Helper function to convert base64 to blob (React Native compatible)
const dataURLtoBlob = async (dataURL: string): Promise<Blob> => {
  // For React Native, we need to use fetch to convert the data URL to blob
  const response = await fetch(dataURL);
  return response.blob();
};
