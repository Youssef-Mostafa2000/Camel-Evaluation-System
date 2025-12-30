/*
  # Camel Commerce & Marketplace System

  ## Overview
  Complete marketplace system for buying and selling camels with secure transactions,
  offers, reviews, and seller/buyer management.

  ## 1. New Tables

  ### commerce_listings
  Main marketplace listings for camels for sale.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier
  - `seller_id` (uuid) - References auth.users (seller)
  - `camel_profile_id` (uuid, nullable) - References camel_profiles (optional link)
  - `title` (text) - Listing title
  - `description` (text) - Detailed description
  - `price` (numeric) - Asking price in SAR
  - `currency` (text) - Currency code (default SAR)
  - `is_negotiable` (boolean) - Whether price is negotiable
  - `is_featured` (boolean) - Premium featured listing
  - `camel_name` (text) - Name of camel
  - `camel_sex` (text) - Male/Female
  - `camel_age` (integer) - Age in years
  - `camel_breed` (text) - Breed type
  - `camel_color` (text) - Camel color
  - `location_province` (text) - Saudi Arabia province
  - `location_city` (text) - City name
  - `primary_image_url` (text) - Main listing image
  - `additional_images` (jsonb) - Array of additional images
  - `head_beauty_score` (numeric) - Beauty score
  - `neck_beauty_score` (numeric) - Beauty score
  - `body_hump_limbs_score` (numeric) - Beauty score
  - `body_size_score` (numeric) - Beauty score
  - `overall_score` (numeric) - Overall beauty score
  - `health_certificates` (jsonb) - Health documents
  - `certifications` (jsonb) - Additional certifications
  - `listing_status` (text) - 'active', 'sold', 'delisted', 'expired'
  - `listing_duration_days` (integer) - Duration (7/30/90)
  - `expires_at` (timestamptz) - Expiration date
  - `view_count` (integer) - Number of views
  - `inquiry_count` (integer) - Number of inquiries
  - `offer_count` (integer) - Number of offers received
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - `sold_at` (timestamptz, nullable) - When sold

  ### commerce_offers
  Buyer offers on listings.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier
  - `listing_id` (uuid) - References commerce_listings
  - `buyer_id` (uuid) - References auth.users
  - `seller_id` (uuid) - References auth.users
  - `offer_amount` (numeric) - Offer price
  - `message` (text) - Offer message
  - `status` (text) - 'pending', 'accepted', 'rejected', 'withdrawn', 'countered'
  - `counter_offer_amount` (numeric, nullable) - Seller counter offer
  - `counter_message` (text, nullable) - Counter offer message
  - `created_at` (timestamptz) - When offer was made
  - `responded_at` (timestamptz, nullable) - When seller responded
  - `expires_at` (timestamptz) - Offer expiration

  ### commerce_transactions
  Completed sales transactions.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier
  - `listing_id` (uuid) - References commerce_listings
  - `seller_id` (uuid) - References auth.users
  - `buyer_id` (uuid) - References auth.users
  - `final_price` (numeric) - Agreed price
  - `payment_method` (text) - Payment method used
  - `payment_status` (text) - 'pending', 'completed', 'refunded', 'failed'
  - `transaction_notes` (text) - Additional notes
  - `seller_confirmed` (boolean) - Seller confirmation
  - `buyer_confirmed` (boolean) - Buyer confirmation
  - `created_at` (timestamptz) - Transaction date
  - `completed_at` (timestamptz, nullable) - Completion date

  ### seller_reviews
  Reviews and ratings for sellers.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier
  - `seller_id` (uuid) - References auth.users (reviewed seller)
  - `buyer_id` (uuid) - References auth.users (reviewer)
  - `transaction_id` (uuid) - References commerce_transactions
  - `rating` (integer) - Rating 1-5 stars
  - `review_title` (text) - Review headline
  - `review_text` (text) - Detailed review
  - `response_text` (text, nullable) - Seller response
  - `created_at` (timestamptz) - Review date
  - `responded_at` (timestamptz, nullable) - Response date

  ### listing_favorites
  Saved/favorite listings for buyers.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid) - References auth.users
  - `listing_id` (uuid) - References commerce_listings
  - `notes` (text, nullable) - User notes
  - `created_at` (timestamptz) - When favorited

  ### commerce_inquiries
  Buyer questions/messages to sellers.
  
  Columns:
  - `id` (uuid, primary key) - Unique identifier
  - `listing_id` (uuid) - References commerce_listings
  - `buyer_id` (uuid) - References auth.users
  - `seller_id` (uuid) - References auth.users
  - `subject` (text) - Inquiry subject
  - `message` (text) - Inquiry message
  - `response` (text, nullable) - Seller response
  - `is_read` (boolean) - Read status
  - `created_at` (timestamptz) - Inquiry date
  - `responded_at` (timestamptz, nullable) - Response date

  ## 2. Security
  
  All tables have RLS enabled with appropriate policies for user access control.
  Sellers can manage their listings, buyers can make offers and save favorites.
*/

-- =====================================================================
-- 1. CREATE COMMERCE_LISTINGS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS commerce_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  camel_profile_id uuid REFERENCES camel_profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL,
  price numeric(12,2) CHECK (price >= 0) NOT NULL,
  currency text DEFAULT 'SAR' NOT NULL,
  is_negotiable boolean DEFAULT true NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  camel_name text NOT NULL,
  camel_sex text CHECK (camel_sex IN ('male', 'female')) NOT NULL,
  camel_age integer CHECK (camel_age > 0 AND camel_age <= 30),
  camel_breed text,
  camel_color text,
  location_province text,
  location_city text,
  primary_image_url text,
  additional_images jsonb DEFAULT '[]'::jsonb,
  head_beauty_score numeric(5,2) CHECK (head_beauty_score >= 0 AND head_beauty_score <= 100),
  neck_beauty_score numeric(5,2) CHECK (neck_beauty_score >= 0 AND neck_beauty_score <= 100),
  body_hump_limbs_score numeric(5,2) CHECK (body_hump_limbs_score >= 0 AND body_hump_limbs_score <= 100),
  body_size_score numeric(5,2) CHECK (body_size_score >= 0 AND body_size_score <= 100),
  overall_score numeric(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
  health_certificates jsonb DEFAULT '[]'::jsonb,
  certifications jsonb DEFAULT '[]'::jsonb,
  listing_status text CHECK (listing_status IN ('active', 'sold', 'delisted', 'expired')) DEFAULT 'active' NOT NULL,
  listing_duration_days integer CHECK (listing_duration_days IN (7, 30, 90)) DEFAULT 30 NOT NULL,
  expires_at timestamptz,
  view_count integer DEFAULT 0 NOT NULL,
  inquiry_count integer DEFAULT 0 NOT NULL,
  offer_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  sold_at timestamptz
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_commerce_listings_seller_id ON commerce_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_commerce_listings_status ON commerce_listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_commerce_listings_featured ON commerce_listings(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_commerce_listings_price ON commerce_listings(price);
CREATE INDEX IF NOT EXISTS idx_commerce_listings_score ON commerce_listings(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_commerce_listings_location ON commerce_listings(location_province);
CREATE INDEX IF NOT EXISTS idx_commerce_listings_created_at ON commerce_listings(created_at DESC);

-- Enable RLS
ALTER TABLE commerce_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commerce_listings

-- Anyone authenticated can view active listings
CREATE POLICY "Anyone can view active listings"
  ON commerce_listings FOR SELECT
  TO authenticated
  USING (listing_status = 'active' AND expires_at > now());

-- Sellers can view their own listings regardless of status
CREATE POLICY "Sellers can view own listings"
  ON commerce_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Sellers can create listings
CREATE POLICY "Sellers can create listings"
  ON commerce_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own listings
CREATE POLICY "Sellers can update own listings"
  ON commerce_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can delete their own listings
CREATE POLICY "Sellers can delete own listings"
  ON commerce_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- =====================================================================
-- 2. CREATE COMMERCE_OFFERS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS commerce_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES commerce_listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  offer_amount numeric(12,2) CHECK (offer_amount >= 0) NOT NULL,
  message text,
  status text CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'countered')) DEFAULT 'pending' NOT NULL,
  counter_offer_amount numeric(12,2) CHECK (counter_offer_amount >= 0),
  counter_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  responded_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days') NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_commerce_offers_listing_id ON commerce_offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_commerce_offers_buyer_id ON commerce_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_commerce_offers_seller_id ON commerce_offers(seller_id);
CREATE INDEX IF NOT EXISTS idx_commerce_offers_status ON commerce_offers(status);
CREATE INDEX IF NOT EXISTS idx_commerce_offers_created_at ON commerce_offers(created_at DESC);

-- Enable RLS
ALTER TABLE commerce_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commerce_offers

-- Buyers can view their own offers
CREATE POLICY "Buyers can view own offers"
  ON commerce_offers FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

-- Sellers can view offers on their listings
CREATE POLICY "Sellers can view offers on own listings"
  ON commerce_offers FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Buyers can create offers
CREATE POLICY "Buyers can create offers"
  ON commerce_offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Buyers can update their own offers (withdraw)
CREATE POLICY "Buyers can update own offers"
  ON commerce_offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update offers on their listings (accept/reject/counter)
CREATE POLICY "Sellers can update offers on own listings"
  ON commerce_offers FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- =====================================================================
-- 3. CREATE COMMERCE_TRANSACTIONS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS commerce_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES commerce_listings(id) ON DELETE SET NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  final_price numeric(12,2) CHECK (final_price >= 0) NOT NULL,
  payment_method text,
  payment_status text CHECK (payment_status IN ('pending', 'completed', 'refunded', 'failed')) DEFAULT 'pending' NOT NULL,
  transaction_notes text,
  seller_confirmed boolean DEFAULT false NOT NULL,
  buyer_confirmed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_commerce_transactions_seller_id ON commerce_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_commerce_transactions_buyer_id ON commerce_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_commerce_transactions_status ON commerce_transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_commerce_transactions_created_at ON commerce_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE commerce_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commerce_transactions

-- Sellers can view their transactions
CREATE POLICY "Sellers can view own transactions"
  ON commerce_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Buyers can view their transactions
CREATE POLICY "Buyers can view own transactions"
  ON commerce_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

-- System creates transactions (through functions)
CREATE POLICY "Allow transaction creation"
  ON commerce_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Participants can update transactions (confirmations)
CREATE POLICY "Participants can update transactions"
  ON commerce_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- =====================================================================
-- 4. CREATE SELLER_REVIEWS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id uuid REFERENCES commerce_transactions(id) ON DELETE SET NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_title text,
  review_text text NOT NULL,
  response_text text,
  created_at timestamptz DEFAULT now() NOT NULL,
  responded_at timestamptz
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_seller_reviews_seller_id ON seller_reviews(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_buyer_id ON seller_reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_rating ON seller_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_seller_reviews_created_at ON seller_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE seller_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_reviews

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
  ON seller_reviews FOR SELECT
  TO authenticated
  USING (true);

-- Buyers can create reviews for completed transactions
CREATE POLICY "Buyers can create reviews"
  ON seller_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Sellers can respond to their reviews
CREATE POLICY "Sellers can respond to reviews"
  ON seller_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- =====================================================================
-- 5. CREATE LISTING_FAVORITES TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS listing_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES commerce_listings(id) ON DELETE CASCADE NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, listing_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_listing_favorites_user_id ON listing_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_favorites_listing_id ON listing_favorites(listing_id);

-- Enable RLS
ALTER TABLE listing_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listing_favorites

-- Users can view their own favorites
CREATE POLICY "Users can view own favorites"
  ON listing_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites"
  ON listing_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their favorites
CREATE POLICY "Users can delete own favorites"
  ON listing_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================================
-- 6. CREATE COMMERCE_INQUIRIES TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS commerce_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES commerce_listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  response text,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  responded_at timestamptz
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_commerce_inquiries_listing_id ON commerce_inquiries(listing_id);
CREATE INDEX IF NOT EXISTS idx_commerce_inquiries_buyer_id ON commerce_inquiries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_commerce_inquiries_seller_id ON commerce_inquiries(seller_id);
CREATE INDEX IF NOT EXISTS idx_commerce_inquiries_is_read ON commerce_inquiries(is_read);
CREATE INDEX IF NOT EXISTS idx_commerce_inquiries_created_at ON commerce_inquiries(created_at DESC);

-- Enable RLS
ALTER TABLE commerce_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commerce_inquiries

-- Buyers can view inquiries they sent
CREATE POLICY "Buyers can view own inquiries"
  ON commerce_inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

-- Sellers can view inquiries they received
CREATE POLICY "Sellers can view received inquiries"
  ON commerce_inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

-- Buyers can create inquiries
CREATE POLICY "Buyers can create inquiries"
  ON commerce_inquiries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

-- Sellers can respond to inquiries
CREATE POLICY "Sellers can respond to inquiries"
  ON commerce_inquiries FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- =====================================================================
-- 7. HELPER FUNCTIONS AND TRIGGERS
-- =====================================================================

-- Trigger for commerce_listings updated_at
DROP TRIGGER IF EXISTS update_commerce_listings_updated_at ON commerce_listings;
CREATE TRIGGER update_commerce_listings_updated_at
  BEFORE UPDATE ON commerce_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to set listing expiration date
CREATE OR REPLACE FUNCTION set_listing_expiration()
RETURNS trigger AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + (NEW.listing_duration_days || ' days')::interval;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set expiration date
DROP TRIGGER IF EXISTS set_listing_expiration_trigger ON commerce_listings;
CREATE TRIGGER set_listing_expiration_trigger
  BEFORE INSERT ON commerce_listings
  FOR EACH ROW
  EXECUTE FUNCTION set_listing_expiration();

-- Function to handle new offer
CREATE OR REPLACE FUNCTION handle_new_commerce_offer()
RETURNS trigger AS $$
BEGIN
  -- Increment offer count on listing
  UPDATE commerce_listings
  SET offer_count = offer_count + 1
  WHERE id = NEW.listing_id;
  
  -- Create notification for seller
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (
    NEW.seller_id,
    'inquiry',
    'New Offer Received',
    'You have received a new offer of ' || NEW.offer_amount || ' SAR',
    '/marketplace/offers/' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new offers
DROP TRIGGER IF EXISTS on_commerce_offer_created ON commerce_offers;
CREATE TRIGGER on_commerce_offer_created
  AFTER INSERT ON commerce_offers
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_commerce_offer();

-- Function to handle new inquiry
CREATE OR REPLACE FUNCTION handle_new_commerce_inquiry()
RETURNS trigger AS $$
BEGIN
  -- Increment inquiry count on listing
  UPDATE commerce_listings
  SET inquiry_count = inquiry_count + 1
  WHERE id = NEW.listing_id;
  
  -- Create notification for seller
  INSERT INTO notifications (user_id, type, title, body, link)
  VALUES (
    NEW.seller_id,
    'inquiry',
    'New Inquiry: ' || NEW.subject,
    LEFT(NEW.message, 100),
    '/marketplace/inquiries/' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new inquiries
DROP TRIGGER IF EXISTS on_commerce_inquiry_created ON commerce_inquiries;
CREATE TRIGGER on_commerce_inquiry_created
  AFTER INSERT ON commerce_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_commerce_inquiry();

-- Function to mark listing as sold
CREATE OR REPLACE FUNCTION mark_listing_sold()
RETURNS trigger AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND OLD.payment_status != 'completed' THEN
    UPDATE commerce_listings
    SET 
      listing_status = 'sold',
      sold_at = now()
    WHERE id = NEW.listing_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for marking listing as sold
DROP TRIGGER IF EXISTS on_transaction_completed ON commerce_transactions;
CREATE TRIGGER on_transaction_completed
  AFTER UPDATE ON commerce_transactions
  FOR EACH ROW
  WHEN (NEW.payment_status = 'completed')
  EXECUTE FUNCTION mark_listing_sold();