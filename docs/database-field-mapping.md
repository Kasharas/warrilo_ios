# Database Field Mapping

## Supabase Devices Table Schema

```typescript
// Match existing Supabase devices table
interface Device {
  id: string;
  user_id: string;
  name: string;              // Device name (user must fill)
  supplier: string | null;   // Store name (user can leave blank)
  purchase_date: string;     // Purchase date (user must select)
  warranty_months: number;   // Warranty duration (user must enter)  
  warranty_end_date: string; // Auto-calculated
  location: string | null;   // Not used
  photo_irl: string | null;  // Device photo URL (user can skip)
  notes: string | null;      // Not used
  invoice_url: string;       // Receipt URL (user must upload)
  identifiers: string | null;// Serial number (user can leave blank)
  created_at: string;
}
```

## Add Device Form Field Mapping

```typescript
interface DeviceFormData {
  // Mandatory fields (user must provide)
  name: string;
  purchaseDate: Date | null;
  warrantyMonths: string;
  receipt: { uri: string | null; type: 'camera' | 'library' | null };
  
  // Optional fields (user can leave blank, but fields stay visible)
  serialNumber: string;
  storeName: string;
  devicePhoto: { uri: string | null; type: 'camera' | 'library' | null };
}
```

## Field Mapping Summary

| Form Field | Database Field | Required | Notes |
|------------|----------------|----------|-------|
| `name` | `name` | ✅ Yes | Device name |
| `purchaseDate` | `purchase_date` | ✅ Yes | Purchase date |
| `warrantyMonths` | `warranty_months` | ✅ Yes | Warranty duration in months |
| `receipt.uri` | `invoice_url` | ✅ Yes | Receipt/invoice URL |
| `serialNumber` | `identifiers` | ❌ No | Serial number (optional) |
| `storeName` | `supplier` | ❌ No | Store/retailer name (optional) |
| `devicePhoto.uri` | `photo_irl` | ❌ No | Device photo URL (optional) |
| - | `warranty_end_date` | Auto | Calculated from purchase_date + warranty_months |
| - | `user_id` | Auto | Current authenticated user |
| - | `created_at` | Auto | Timestamp when record created |

## Notes

- **Required fields**: User must provide these to submit the form
- **Optional fields**: User can leave blank, but form fields remain visible
- **Auto-calculated fields**: System generates these automatically
- **Photo field typo**: Database has `photo_irl` instead of `photo_url` (note the typo)
- **Location and Notes**: These fields exist in database but are not used in the form
