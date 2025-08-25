# Google Sign-In Setup Guide (Supabase Built-in)

## 🎯 **What We've Implemented:**

✅ **Supabase Built-in Google OAuth**: Using `supabase.auth.signInWithOAuth()`  
✅ **Google Sign-In Functions**: Created in `lib/supabase.ts`  
✅ **Auth Context**: Updated to include Google Sign-In  
✅ **Login UI**: Updated to use Google Sign-In function  
✅ **No External Packages**: Using Supabase's native OAuth support  

## 🚀 **Setup in Supabase Dashboard:**

### **Step 1: Enable Google Provider**

1. **Go to your Supabase project dashboard**: https://supabase.com/dashboard
2. **Navigate to**: `Authentication` → `Providers`
3. **Find "Google"** in the list
4. **Click "Enable"** toggle
5. **You'll see fields for:**
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret

### **Step 2: Get Google OAuth Credentials**

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create/Select Project**
3. **Enable APIs:**
   - Google+ API
   - Google Sign-In API
4. **Configure OAuth Consent Screen:**
   - User Type: External
   - App Name: "Warrilo App"
   - User Support Email: Your email
   - Developer Contact: Your email
5. **Create OAuth 2.0 Credentials:**
   - Application Type: Web application
   - Name: "Warrilo Web Client"
   - **Authorized redirect URIs**: 
     - `https://pkvlvawtfxdmbddjqdgi.supabase.co/auth/v1/callback`
     - (This is your Supabase project's callback URL)

### **Step 3: Add Credentials to Supabase**

1. **Copy your Google Client ID** from Google Cloud Console
2. **Copy your Google Client Secret** from Google Cloud Console
3. **Paste them** in the Supabase Google provider settings
4. **Click "Save"**

## 🔧 **How It Works Now:**

1. **User clicks "Sign in with Google"**
2. **Supabase opens Google OAuth popup**
3. **User authenticates with Google**
4. **Google redirects back to Supabase**
5. **Supabase creates/authenticates user**
6. **User is automatically signed in**

## 📱 **Current Implementation Status:**

- ✅ **Frontend**: Google Sign-In button functional
- ✅ **Backend**: Supabase Google OAuth integration complete
- ✅ **Code**: All implementation done
- ⏳ **Supabase**: Need to enable Google provider and add credentials

## 🚨 **Important Notes:**

- **No external packages needed** - using Supabase's built-in OAuth
- **Redirect URI must be exactly**: `https://pkvlvawtfxdmbddjqdgi.supabase.co/auth/v1/callback`
- **Google Sign-In will work immediately** after Supabase setup
- **No additional code changes needed**

## 🆘 **What You Need to Do:**

1. **Enable Google provider** in Supabase dashboard
2. **Add Google OAuth credentials** (Client ID & Secret)
3. **That's it!** Google Sign-In will work automatically

## 🎉 **Benefits of This Approach:**

- **Much simpler** than external packages
- **Built-in security** with Supabase
- **Automatic user management** in Supabase
- **No complex configuration** needed
- **Immediate functionality** after setup

**Once you complete the Supabase dashboard setup, Google Sign-In will work perfectly!** 🎯

The implementation is complete - you just need to configure it in Supabase!
