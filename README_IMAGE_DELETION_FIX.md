# Image Deletion Fix Implementation

## Problem Solved
Previously, when deleting devices, only the database record was removed while the associated images remained in Supabase Storage, creating orphaned files.

## Solution Implemented

### 1. **New File Naming Strategy**
- **Before**: Random timestamp-based names (`device_1756049156894.jpg`)
- **After**: Device ID-based names (`{deviceId}_device.jpg`, `{deviceId}_receipt.jpg`)

### 2. **New Supabase Helper Functions**

#### **Upload Functions** (Updated)
- `uploadDeviceImage(file, deviceId, userId)` - Now uses device ID in filename
- `uploadReceiptImage(file, deviceId, userId)` - Now uses device ID in filename

#### **Delete Functions** (New)
- `deleteDeviceImage(deviceId, userId)` - Deletes specific device image
- `deleteReceiptImage(deviceId, userId)` - Deletes specific receipt image
- `deleteDeviceImages(deviceId, userId)` - Deletes both images for a device

#### **File Management Functions** (New)
- `renameTempImages(tempDeviceId, permanentDeviceId, userId)` - Renames temp files after device creation
- `cleanupOrphanedTempFiles(userId)` - Removes old temporary files

### 3. **Updated DataContext**

#### **addDevice Function**
- Creates temporary device with local images
- Uploads images with temporary names
- After successful Supabase creation, renames files to permanent names
- Uses device ID for permanent file naming

#### **deleteDevice Function**
- **First**: Deletes images from Supabase Storage
- **Then**: Deletes database record
- **Finally**: Updates local storage

### 4. **How It Works Now**

#### **Adding a Device:**
1. User selects images → Stored locally for immediate display
2. Images uploaded to Supabase with temporary names (`temp_device_{timestamp}.jpg`)
3. Device created in database → Returns permanent device ID
4. Images renamed to permanent names (`{deviceId}_device.jpg`)
5. Temporary files cleaned up

#### **Deleting a Device:**
1. Images deleted from Supabase Storage buckets
2. Database record deleted
3. Local state updated
4. No orphaned files left behind

### 5. **File Structure in Storage**

```
device-images/
  └── {userId}/
      ├── {deviceId}_device.jpg
      ├── {deviceId}_receipt.jpg
      └── ...

receipt-images/
  └── {userId}/
      ├── {deviceId}_receipt.jpg
      └── ...
```

### 6. **Benefits**

✅ **No More Orphaned Files** - Images are properly deleted with devices
✅ **Better File Organization** - Files named by device ID for easy tracking
✅ **Automatic Cleanup** - Temporary files are cleaned up automatically
✅ **Error Handling** - Graceful fallback if storage operations fail
✅ **Immediate Display** - Images still show immediately in device cards

### 7. **Testing**

To test the fix:
1. Add a new device with images
2. Verify images appear in device cards
3. Delete the device
4. Check Supabase Storage - images should be gone
5. Check database - device record should be gone

### 8. **Backward Compatibility**

- Existing devices with old image URLs will continue to work
- New devices will use the improved system
- Old orphaned files can be cleaned up manually if needed

## Files Modified

- `lib/supabase.ts` - Added delete and file management functions
- `contexts/DataContext.tsx` - Updated delete logic and file renaming
- `app/add-device.tsx` - Updated to use temporary file names during upload

## Notes

- The system now properly tracks files by device ID
- Temporary files are automatically cleaned up after 1 hour
- Error handling ensures device deletion continues even if image deletion fails
- All operations are logged for debugging purposes
