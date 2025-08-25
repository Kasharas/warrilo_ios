# Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for your Warrilo mobile app.

## 🚀 **Step 1: Create a Supabase Project**

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "New Project"
3. Sign in with GitHub or create an account
4. Choose your organization
5. Enter project details:
   - **Name**: `warrilo-mobile` (or any name you prefer)
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to your users
6. Click "Create new project"

## 🔑 **Step 2: Get Your API Keys**

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## ⚙️ **Step 3: Configure Your App**

1. Open `lib/config.ts` in your project
2. Replace the placeholder values with your actual credentials:

```typescript
export const SUPABASE_CONFIG = {
  url: 'https://your-project-id.supabase.co',
  anonKey: 'your-actual-anon-key-here',
};
```

## 🔐 **Step 4: Enable Authentication**

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Site URL**, add your app's URL:
   - For development: `http://localhost:8081`
   - For production: Your actual domain
3. Under **Redirect URLs**, add:
   - `http://localhost:8081/**`
   - `exp://192.168.1.6:8081/**` (adjust IP as needed)

## 📧 **Step 5: Configure Email Templates (Optional)**

1. Go to **Authentication** → **Email Templates**
2. Customize the email templates for:
   - **Confirm signup**
   - **Reset password**
   - **Magic link**

## 🧪 **Step 6: Test Authentication**

1. Start your development server: `npm run dev`
2. Open the app in your browser or mobile device
3. Try creating a new account
4. Check your email for verification
5. Try logging in with your credentials

## 🔒 **Security Features**

Your app now includes:
- ✅ **Email/Password authentication**
- ✅ **User session management**
- ✅ **Protected routes**
- ✅ **Automatic redirects**
- ✅ **Loading states**
- ✅ **Error handling**

## 🚨 **Important Notes**

- **Never commit your actual API keys** to version control
- **Use environment variables** in production
- **Enable Row Level Security (RLS)** for your database tables
- **Set up proper email verification** for production use

## 🆘 **Troubleshooting**

### Common Issues:

1. **"Invalid API key" error**
   - Check that you copied the correct anon key
   - Ensure the key starts with `eyJ...`

2. **"Invalid URL" error**
   - Verify your project URL is correct
   - Make sure it starts with `https://`

3. **Authentication not working**
   - Check browser console for errors
   - Verify redirect URLs are configured correctly
   - Ensure email verification is enabled

4. **Email not received**
   - Check spam folder
   - Verify email templates are configured
   - Check Supabase logs for email delivery status

## 📚 **Next Steps**

After setting up authentication, you can:
- Add social login providers (Google, Apple, GitHub)
- Implement password reset functionality
- Add user profile management
- Set up database tables with RLS
- Add role-based access control

## 🆘 **Need Help?**

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
