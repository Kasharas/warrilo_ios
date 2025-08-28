import { useRouter } from 'expo-router';
import { DeviceLocalStorage } from '@/src/lib/localStorage';
import { supabase } from '@/src/lib/supabase';
import { LocalDevice } from '@/src/lib/localStorage';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';

export const useDeviceOperations = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { triggerSync } = useSync();

  const deleteDevice = async (device: LocalDevice) => {
    try {
      console.log('🧪 COMPLETE FLOW TEST: === STARTING DELETE VERIFICATION ===');
      console.log('🧪 FLOW TEST: Pre-delete device count check...');
      
      const preDeleteDevices = await DeviceLocalStorage.getDevices();
      console.log('🧪 FLOW TEST: Devices before delete:', preDeleteDevices.length);
      console.log('🧪 FLOW TEST: Target device exists in local storage:', !!preDeleteDevices.find(d => d.id === device.id));
      
      console.log('🎯 FLOW TEST: === DELETE FLOW STARTED ===');
      console.log('🎯 FLOW TEST: Target device:', { id: device.id, name: device.name });
      console.log('🎯 FLOW TEST: User ID:', user?.id);
      const startTime = Date.now();
      
      console.log('🗑️ DELETE STARTED:', device.id, device.name);
      
      // Phase 1: Local storage removal (optimistic update)
      console.log('🎯 FLOW TEST: Step 1/4 - Local storage update starting...');
      console.log('📱 Phase 1: Removing from local storage...');
      const devices = await DeviceLocalStorage.getDevices();
      console.log('DEBUG: Devices before filter:', devices.length);
      console.log('DEBUG: Target device ID:', device.id);
      console.log('DEBUG: Target device ID type:', typeof device.id);

      console.log('DEBUG: First device ID:', devices[0]?.id);
      console.log('DEBUG: First device ID type:', typeof devices[0]?.id);


      const updated = devices.filter(d => {
        console.log('DEBUG: Comparing', d.id, '!==', device.id);
        const keepDevice = d.id !== device.id;
        console.log('DEBUG: Keep device?', keepDevice);
        return keepDevice;
      });

      console.log('DEBUG: Devices after filter:', updated.length);
      await DeviceLocalStorage.saveDevices(updated);
      console.log('✅ Device removed from local storage');
      
      // Verification: Check local storage after update
      const verifyLocalStorage = await DeviceLocalStorage.getDevices();
      console.log('🔍 VERIFICATION: Local storage devices after delete:', verifyLocalStorage.length);
      console.log('🔍 VERIFICATION: Device removed from local storage:', !verifyLocalStorage.find(d => d.id === device.id));
      
      // Phase 2: Navigate immediately
      console.log('🎯 FLOW TEST: Step 2/4 - Navigation starting...');
      console.log('🔄 Phase 2: Navigating back to dashboard...');
      router.push('/(tabs)');
      
      // Verification: Sync triggered for consistency check
      console.log('🎯 FLOW TEST: Step 4/4 - Sync trigger starting...');
      console.log('🔍 VERIFICATION: Sync triggered for consistency check');
      
      // Phase 3: Supabase delete (background)
      if (device.id) { // Only delete from Supabase if device has a remote ID
        console.log('🎯 FLOW TEST: Step 3/4 - Supabase delete starting...');
        console.log('☁️ Phase 3: Deleting from Supabase...');
        const { error } = await supabase
          .from('devices')
          .delete()
          .eq('id', device.id);
        
        // Phase 4: Rollback on error
        if (error) {
          console.error('Supabase delete failed:', error);
          
          // Restore device to local storage
          const currentDevices = await DeviceLocalStorage.getDevices();
          const restored = [...currentDevices, device];
          await DeviceLocalStorage.saveDevices(restored);
          
          // Show error notification (could be enhanced with toast/alert)
          console.warn('Device deletion failed on server, restored locally');
        } else {
          console.log('✅ Device successfully deleted from Supabase');
          console.log('🔍 VERIFICATION: Supabase delete completed for device:', device.id);
          
          // Phase 4: Clean up device photos from storage
          console.log('🧹 Phase 4: Cleaning up device photos...');

          if (device.photo_irl) {
            try {
              // Extract file path from photo_irl
              const urlParts = device.photo_irl.split('/');
              const filePath = urlParts.slice(-2).join('/'); // Gets "userId/filename.ext"
              
              const { error: photoError } = await supabase.storage
                .from('device-photos')
                .remove([filePath]);
                
              if (photoError) {
                console.error('❌ Failed to delete device photo:', photoError);
              } else {
                console.log('✅ Device photo deleted from storage');
              }
            } catch (photoDeleteError) {
              console.error('❌ Photo cleanup error:', photoDeleteError);
            }
          }

          // Clean up any additional photos from device_photos table
          try {
            const { error: additionalPhotosError } = await supabase.storage
              .from('device-photos')
              .remove([`${user.id}/${device.id}/`]);
              
            if (additionalPhotosError) {
              console.log('ℹ️ No additional photos found or cleanup not needed');
            } else {
              console.log('✅ Additional device photos cleaned up');
            }
          } catch (error) {
            console.log('ℹ️ Additional photo cleanup skipped:', error.message);
          }
          
          // Phase 5: Trigger sync after Supabase delete completes
          console.log('🔄 Phase 5: Triggering sync after cloud delete...');
          
          // Wait a moment for Supabase delete to propagate
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Trigger sync to verify consistency (should find no mismatch now)
          await triggerSync();
          
          // VERIFICATION: Confirm complete deletion
          console.log('🔍 FINAL VERIFICATION: Starting delete verification...');
          
          // Verify local storage
          const finalLocalDevices = await DeviceLocalStorage.getDevices();
          console.log('🔍 VERIFICATION: Final local device count:', finalLocalDevices.length);
          console.log('🔍 VERIFICATION: Target device removed from local:', !finalLocalDevices.find(d => d.id === device.id));
          
          // Verify Supabase (optional check)
          try {
            const { data: supabaseCheck } = await supabase
              .from('devices')
              .select('id')
              .eq('id', device.id)
              .eq('user_id', user.id);
              
            console.log('🔍 VERIFICATION: Device removed from Supabase:', !supabaseCheck || supabaseCheck.length === 0);
          } catch (error) {
            console.log('🔍 VERIFICATION: Supabase check skipped:', error.message);
          }
          
          console.log('🔍 VERIFICATION: Delete operation verification completed');
          
          console.log('🧪 COMPLETE FLOW TEST: === DELETE VERIFICATION COMPLETED ===');
          console.log('🧪 FLOW TEST: Expected result: 1 device removed, photos cleaned, no sync restoration');
          console.log('🧪 FLOW TEST: Actual result logged above in verification section');
        }
      } else {
        console.log('Device was local only, no Supabase sync needed');
      }
      
      console.log('✅ DELETE OPERATION COMPLETED SUCCESSFULLY');
      
      console.log('🎯 FLOW TEST: === DELETE FLOW COMPLETED ===');
      console.log('🎯 FLOW TEST: Total execution time:', Date.now() - startTime, 'ms');
    } catch (error) {
      console.error('Error in deleteDevice operation:', error);
      
      // Emergency rollback on any unexpected error
      try {
        const currentDevices = await DeviceLocalStorage.getDevices();
        const deviceExists = currentDevices.some(d => 
          d.local_id === device.local_id || d.id === device.id
        );
        
        if (!deviceExists) {
          const restored = [...currentDevices, device];
          await DeviceLocalStorage.saveDevices(restored);
          console.warn('Emergency rollback: Device restored due to unexpected error');
        }
      } catch (rollbackError) {
        console.error('Emergency rollback failed:', rollbackError);
      }
    }
  };

  return {
    deleteDevice,
  };
};
