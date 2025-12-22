# Supabase Setup Guide for EventPass

This guide walks you through setting up the necessary Supabase tables for the EventPass ticketing application.

## Prerequisites
- Supabase account (https://supabase.com)
- Access to your Supabase project dashboard

## Setup Steps

### 1. Create Tables via SQL

Go to your Supabase dashboard → SQL Editor → Create a new query and paste the following SQL:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  government_id VARCHAR(50),
  id_type VARCHAR(50) DEFAULT 'aadhaar',
  is_admin BOOLEAN DEFAULT FALSE,
  bio_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  price INTEGER NOT NULL,
  image TEXT NOT NULL,
  category VARCHAR(100),
  available INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id VARCHAR(50) UNIQUE NOT NULL,
  event_id UUID NOT NULL REFERENCES events(id),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  bio_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  purchase_date TIMESTAMP DEFAULT NOW(),
  tx_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create ledger table (for blockchain transaction history)
CREATE TABLE ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tickets_owner ON tickets(owner_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_active ON events(is_active);
```

### 2. Set Up Row Level Security (RLS)

In your Supabase dashboard, go to Authentication → Policies and add these policies:

#### For `user_profiles` table:

```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (is_admin = true AND auth.uid() IN (
    SELECT id FROM user_profiles WHERE is_admin = true
  ));
```

#### For `events` table:

```sql
-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anyone can view active events
CREATE POLICY "Users can view active events"
  ON events FOR SELECT
  USING (is_active = true);

-- Only admins can insert events
CREATE POLICY "Admins can create events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM user_profiles WHERE is_admin = true
  ));

-- Only admins can update events
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM user_profiles WHERE is_admin = true
  ));

-- Only admins can delete events
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM user_profiles WHERE is_admin = true
  ));
```

#### For `tickets` table:

```sql
-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tickets
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = owner_id);

-- System can insert tickets (during purchase)
CREATE POLICY "System can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (true);

-- Users can update their own tickets (change status)
CREATE POLICY "Users can update own tickets"
  ON tickets FOR UPDATE
  USING (auth.uid() = owner_id);
```

#### For `ledger` table:

```sql
-- Enable RLS
ALTER TABLE ledger ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view ledger
CREATE POLICY "Authenticated users can view ledger"
  ON ledger FOR SELECT
  USING (auth.role() = 'authenticated');

-- System can insert ledger entries
CREATE POLICY "System can create ledger entries"
  ON ledger FOR INSERT
  WITH CHECK (true);
```

### 3. Create Admin User

To make yourself an admin, run this query in your Supabase SQL editor:

```sql
UPDATE user_profiles 
SET is_admin = true 
WHERE email = 'your_email@example.com';
```

Replace `'your_email@example.com'` with your actual email.

### 4. Insert Sample Events (Optional)

```sql
INSERT INTO events (title, location, date, price, image, category, available, description) VALUES
  ('IPL Final 2025: CSK vs MI', 'Wankhede Stadium, Mumbai', '2025-05-28', 3500, 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800', 'Sports', 120, 'Watch the thrilling IPL final live!'),
  ('Arijit Singh: Soulful Night', 'JLN Stadium, Delhi', '2025-06-15', 2500, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800', 'Music', 45, 'Experience Arijit Singh''s mesmerizing voice.'),
  ('Sunburn Arena: Martin Garrix', 'Vagator Beach, Goa', '2025-12-29', 4000, 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80&w=800', 'Festival', 10, 'Electronic music festival featuring Martin Garrix.');
```

## Testing the Setup

1. **Test User Sign-Up:**
   - Go to your app → Login/Sign-up
   - Create a new account
   - Verify that a `user_profiles` entry is created

2. **Test Event Creation (Admin Only):**
   - Sign in as admin
   - Go to Manage Events
   - Try to add a new event
   - Verify it appears in the marketplace

3. **Test Ticket Purchase:**
   - Browse events
   - Click "Book Now" on any event
   - Complete the purchase
   - Verify a ticket entry is created in the `tickets` table

4. **Test User Profile:**
   - Click on your profile avatar
   - Select "My Profile"
   - Fill in your details
   - Save and verify the data is stored

## Important Notes

⚠️ **Security Considerations:**
- Always use HTTPS in production
- Never expose your Supabase `service_role` key in frontend code
- Use Row-Level Security (RLS) for all tables
- Validate all user inputs on the backend
- Keep your `anon` key secret

## Environment Variables

Add these to your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Get these from: Supabase Dashboard → Settings → API

## Troubleshooting

**Issue:** Events don't show up in marketplace
- **Solution:** Check if `is_active = true` in the events table

**Issue:** Can't update profile
- **Solution:** Ensure RLS policies are correctly set up and you're authenticated

**Issue:** Admin operations fail
- **Solution:** Verify that your user's `is_admin` is set to `true` in `user_profiles`

**Issue:** Tables don't exist
- **Solution:** Run the SQL setup script in Supabase SQL Editor again

## Next Steps

1. Test the entire flow with sample data
2. Set up proper error handling and validation
3. Consider adding email notifications (Supabase Email Auth)
4. Implement payment processing (Stripe, Razorpay, etc.)
5. Add more event filters and categories

For more info: https://supabase.com/docs
