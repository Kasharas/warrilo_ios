# Warrilo Mobile App - QA Checklist

## Test Environment Setup
- [ ] App runs successfully with `expo start`
- [ ] All dependencies installed correctly
- [ ] Mock data loads properly
- [ ] No console errors on startup

## Navigation Testing
- [ ] Welcome screen loads and displays correctly
- [ ] Login screen accessible from welcome screen
- [ ] Tab navigation works between all main screens
- [ ] Back navigation works on all screens
- [ ] Deep linking to device details works
- [ ] Settings screen accessible from profile
- [ ] Plan selection screen accessible from settings

## Welcome Screen
- [ ] Logo displays correctly with shield icon
- [ ] Feature list animations work smoothly
- [ ] "Get Started" button navigates to login
- [ ] "Already have an account" navigates to login
- [ ] All text and spacing matches mockup

## Login Screen
- [ ] Email and password fields work correctly
- [ ] Password show/hide toggle functions
- [ ] "Forgot password" shows stub modal
- [ ] "Sign In" button navigates to dashboard
- [ ] Social login buttons show stub alerts
- [ ] Form validation works properly

## Dashboard Screen
- [ ] Header displays correctly with menu button
- [ ] Summary card shows total warranty value
- [ ] Warranty alert card displays properly
- [ ] Alert action buttons work (View Details, Remind Later)
- [ ] Recent devices grid displays 2x2 layout
- [ ] Device cards show correct information
- [ ] FAB button opens add device screen
- [ ] Tab bar navigation works

## Add Device Screen
- [ ] Header with back/save buttons works
- [ ] Device photo upload zone shows camera/gallery stub
- [ ] Receipt upload zone functions
- [ ] OCR toggle shows PRO modal when activated
- [ ] All form fields accept input
- [ ] Warranty expiry calculation works
- [ ] Save button validates required fields
- [ ] Navigation back to device list works

## Device List Screen
- [ ] Header with search and filter icons
- [ ] Search functionality filters devices
- [ ] Filter chips work (All, Electronics, Appliances)
- [ ] Device cards display correctly
- [ ] Swipe-to-delete shows confirmation modal
- [ ] Device deletion removes from list
- [ ] Tapping device navigates to details
- [ ] FAB button opens add device screen

## Device Details Screen
- [ ] Device information displays correctly
- [ ] Warranty status card shows proper status
- [ ] Progress bar reflects warranty remaining
- [ ] Purchase information section complete
- [ ] Receipts gallery shows thumbnails
- [ ] "Add Receipt" button functions
- [ ] "Edit Device" button works
- [ ] Back navigation works

## Alerts Screen
- [ ] Tab filters work (Active/All)
- [ ] Notification items display correctly
- [ ] Different notification types show proper icons/colors
- [ ] Tapping notifications works
- [ ] Alert counts update properly

## Profile Screen
- [ ] User avatar and information display
- [ ] Account overview statistics show
- [ ] PRO plan badge displays
- [ ] Family sharing section shows members
- [ ] "Invite Family Member" shows PRO modal
- [ ] "Edit Profile" button functions

## Settings Screen
- [ ] All settings sections display
- [ ] Toggle switches work for allowed features
- [ ] PRO feature toggles show upgrade modal
- [ ] Settings navigation works
- [ ] "Sign Out" returns to welcome screen

## Plan Selection Screen
- [ ] Monthly/Yearly toggle works with savings calculation
- [ ] Plan cards display correctly
- [ ] Feature lists show proper checkmarks
- [ ] "Upgrade to Pro" shows trial confirmation
- [ ] Plan selection radio buttons work
- [ ] Back navigation works

## PRO Feature Testing
- [ ] OCR toggle in add device shows PRO modal
- [ ] Family sharing invite shows PRO modal
- [ ] Email integration toggle shows PRO modal
- [ ] PRO modal displays correctly
- [ ] "View Plans" navigates to plan selection
- [ ] "Got it" dismisses modal

## Mock Data Testing
- [ ] Device list shows varied warranty statuses
- [ ] Dashboard calculates totals correctly
- [ ] Alerts show different types and timestamps
- [ ] Search filters work with mock data
- [ ] Device details show complete information

## UI/UX Testing
- [ ] All colors match provided mockups
- [ ] Spacing and typography consistent
- [ ] Icons and emojis display correctly
- [ ] Animations are smooth and purposeful
- [ ] Touch targets are appropriately sized
- [ ] Loading states work properly
- [ ] Error states display correctly

## Integration Stubs
- [ ] Auth service stubs work correctly
- [ ] Database service stubs function
- [ ] Storage service stubs respond
- [ ] Payment service stubs work
- [ ] OCR service stubs function
- [ ] Push notification stubs work

## Performance Testing
- [ ] App starts quickly
- [ ] Navigation is responsive
- [ ] Scrolling is smooth
- [ ] Images load efficiently
- [ ] Memory usage is reasonable

## Edge Cases
- [ ] Empty device list handled
- [ ] No alerts state handled
- [ ] Network error states work
- [ ] Invalid form data handled
- [ ] Deep link errors handled

## Accessibility
- [ ] Screen reader compatibility
- [ ] Touch target sizes adequate
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] Alternative text provided

## Platform Testing
- [ ] iOS specific features work
- [ ] Android specific features work
- [ ] Web platform compatibility (if applicable)
- [ ] Different screen sizes supported

## Acceptance Criteria
- [ ] All screens render with mock data
- [ ] Navigation flows work end-to-end
- [ ] PRO features show upgrade modals
- [ ] Integrations are properly stubbed
- [ ] UI matches provided mockups
- [ ] App performs well on target devices

## Notes
- This is a demo app with stub integrations
- PRO features are UI-only and show upgrade prompts
- Real API keys should not be included in demo
- All critical user flows should work with mock data