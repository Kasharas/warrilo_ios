import { supabase } from '../supabaseClient';
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
    const blob = dataURLtoBlob(compressedImage);
    
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
    
    const blob = dataURLtoBlob(compressedImage);
    
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

// Helper function to convert base64 to blob
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};
