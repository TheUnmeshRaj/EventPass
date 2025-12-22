# 🚀 EventPass Quick Setup Checklist

## Phase 1: Supabase Configuration (5 mins)

- [ ] **Step 1.1**: Open Supabase Dashboard
  - Go to https://supabase.com and sign in

- [ ] **Step 1.2**: Create/Open your project
  - Note down your `Project URL` and `Anon Key`

- [ ] **Step 1.3**: Run SQL Setup Script
  - Go to SQL Editor → New Query
  - Copy entire SQL script from [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
  - Run the script
  - Wait for tables to be created

- [ ] **Step 1.4**: Set Up RLS Policies
  - Still in SQL Editor, run all RLS policy scripts
  - Verify all policies are created in Authentication → Policies

- [ ] **Step 1.5**: Create Admin User
  - Update your email in this SQL and run:
    ```sql
    UPDATE user_profiles 
    SET is_admin = true 
    WHERE email = 'your.email@example.com';
    ```

- [ ] **Step 1.6**: (Optional) Add Sample Events
  - Run the sample events INSERT script from [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

## Phase 2: Frontend Configuration (3 mins)

- [ ] **Step 2.1**: Copy Environment Variables
  - Open `.env.local` in your `clientside` folder
  - Add these lines:
    ```
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
    ```
  - Replace with your actual values from Supabase Dashboard → Settings → API

- [ ] **Step 2.2**: Verify Files Exist
  - ✅ `app/components/UserDashboard.jsx`
  - ✅ `app/components/AdminDashboard.jsx`
  - ✅ `app/components/EventsMarketplace.jsx` (updated)
  - ✅ `app/components/Navbar.jsx` (updated)
  - ✅ `lib/supabase/database.ts`
  - ✅ `app/page.jsx` (updated)

- [ ] **Step 2.3**: Install Dependencies (if needed)
  ```bash
  cd clientside
  npm install
  ```

## Phase 3: Testing (10 mins)

- [ ] **Step 3.1**: Start Development Server
  ```bash
  npm run dev
  ```
  - App should open on http://localhost:3000

- [ ] **Step 3.2**: Test Authentication
  - [ ] Click "Login" button
  - [ ] Create a new account
  - [ ] Verify you get logged in
  - [ ] Check Supabase → Authentication → Users (new user should appear)

- [ ] **Step 3.3**: Test User Profile
  - [ ] After login, click your profile avatar
  - [ ] Click "My Profile"
  - [ ] Fill in some details (name, phone, address)
  - [ ] Click "Save Changes"
  - [ ] Verify in Supabase → user_profiles table

- [ ] **Step 3.4**: Test Admin Functions
  - [ ] Click profile avatar
  - [ ] You should see "Manage Events" option
  - [ ] If not visible:
    - Run this SQL again in Supabase:
      ```sql
      UPDATE user_profiles 
      SET is_admin = true 
      WHERE email = 'your_email@example.com';
    ```
    - Refresh the browser (hard refresh: Ctrl+F5)

- [ ] **Step 3.5**: Test Event Management
  - [ ] Click "Manage Events"
  - [ ] Should see list of events (if you added sample data)
  - [ ] Click "+ Add New Event"
  - [ ] Fill form with:
    - Title: "Test Event 2025"
    - Location: "Test City, Test Venue"
    - Date: Pick a future date
    - Price: 2999
    - Category: Music
    - Available: 50
    - Image: https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800
  - [ ] Click "Save Event"
  - [ ] Check Supabase → events table (new event should appear)

- [ ] **Step 3.6**: Test Event Marketplace
  - [ ] Click "Events" in navbar
  - [ ] Should see your newly created event
  - [ ] Try searching by event title/location
  - [ ] Try filtering by category

- [ ] **Step 3.7**: Test Event Editing
  - [ ] Go back to "Manage Events"
  - [ ] Click pencil icon on any event
  - [ ] Change price or title
  - [ ] Click "Save Event"
  - [ ] Go to Events and verify change

- [ ] **Step 3.8**: Test Event Deletion
  - [ ] Go to "Manage Events"
  - [ ] Click trash icon on any event
  - [ ] Confirm deletion
  - [ ] Event should disappear from Events tab

## Phase 4: Verification (5 mins)

- [ ] **Step 4.1**: Check Supabase Data
  - [ ] Go to Supabase Dashboard
  - [ ] Check each table has correct data:
    - [ ] `user_profiles` - has your profile
    - [ ] `events` - has your test events
    - [ ] `user_profiles` - you have `is_admin = true`

- [ ] **Step 4.2**: Test RLS Security
  - [ ] Create a second test account (sign out → sign up with different email)
  - [ ] Log in with second account
  - [ ] You should NOT see "Manage Events" button
  - [ ] Go to Marketplace and verify you can see events
  - [ ] Go to My Profile and verify empty profile (not first user's data)

- [ ] **Step 4.3**: Verify Error Handling
  - [ ] Check browser console (F12) for any errors
  - [ ] Make sure no red errors appear

## 📚 Documentation Files

Read these files for detailed information:

1. **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Complete Supabase setup guide
2. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Feature overview
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design & data flows

## 🔧 Troubleshooting

### "My Profile button not showing"
```
1. Check is_admin in Supabase user_profiles table
2. Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
3. Check browser console for errors
```

### "Events not showing in marketplace"
```
1. Check events table in Supabase
2. Verify is_active = true
3. Check if events have image URLs
4. Check browser console for API errors
```

### "Can't save profile"
```
1. Check user is authenticated (login required)
2. Verify RLS policies are set up
3. Check browser console for error message
4. Verify .env.local has correct Supabase keys
```

### "Manage Events button not appearing"
```
1. Ensure is_admin = true for your user
2. Hard refresh browser
3. Check Supabase RLS policies
4. Verify you're authenticated
```

### "Getting Supabase errors"
```
1. Check NEXT_PUBLIC_SUPABASE_URL format
2. Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is correct
3. Check network tab in browser console
4. Verify Supabase project is active
```

## ✅ Success Indicators

You've successfully set up EventPass if:

✅ You can sign up and log in
✅ You can view your profile and edit it
✅ You can see events in the marketplace
✅ (As admin) You can create, edit, and delete events
✅ Changes appear instantly in the UI
✅ No console errors
✅ Multiple users have separate data

## 🎉 Next Features to Implement

After setup, consider adding:

- [ ] **Payment Integration** - Stripe/Razorpay for ticket purchases
- [ ] **Email Notifications** - Confirmation emails for bookings
- [ ] **QR Code Generation** - Unique QR codes for each ticket
- [ ] **Advanced Search** - Filter by date range, price range
- [ ] **User Reviews** - Rate events after attending
- [ ] **Analytics Dashboard** - Admin analytics
- [ ] **Refund System** - Process refunds for cancellations
- [ ] **Multi-language Support** - Hindi, regional languages
- [ ] **Mobile App** - React Native version
- [ ] **Real Biometric** - Integrate actual face recognition

## 📞 Support

For issues:
1. Check the troubleshooting section
2. Read the relevant documentation file
3. Check browser console (F12) for error messages
4. Verify Supabase dashboard for data

---

**Created:** December 2025
**Status:** Ready for Testing
**Version:** 1.0
