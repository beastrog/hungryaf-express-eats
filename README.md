
# HungryAF Express Eats

A campus food delivery application built with React, TypeScript, Clerk for authentication, and Supabase for backend services.

## Tech Stack

- React with TypeScript
- Tailwind CSS for styling
- Clerk for authentication
- ShadCN UI + Framer Motion for components and animations
- Supabase for database, real-time subscriptions
- Razorpay for payments

## Features

- User authentication with email/phone OTP
- Campus-restricted domains (@yourcollege.edu)
- Browse and order food from campus vendors
- Real-time order tracking
- Delivery partner system
- Admin dashboard for menu management
- Wallet system for delivery partners

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account
- Clerk account

### Installation

1. Clone this repository
   ```bash
   git clone <repository-url>
   cd hungryaf-express-eats
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file based on the `.env.local.example`
   ```bash
   cp .env.local.example .env.local
   ```
   
4. Update the environment variables in `.env.local` with your own keys

5. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Database Setup

1. Create a new Supabase project

2. Run the following SQL migrations in the Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('eater','delivery','admin')) DEFAULT 'eater',
  created_at TIMESTAMP DEFAULT NOW()
);

-- menu items
CREATE TABLE menu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price INT NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  items JSONB NOT NULL,
  total_amount INT NOT NULL,
  status TEXT CHECK (status IN ('placed','paid','delivered')) DEFAULT 'placed',
  payment_status TEXT CHECK (payment_status IN ('pending','completed')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- deliveries
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  delivery_partner_id UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('pending','accepted','completed')) DEFAULT 'pending',
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- wallets & earnings
CREATE TABLE wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  balance INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE delivery_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_partner_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  earning INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert some sample menu items
INSERT INTO menu (name, description, price, available) VALUES
('Classic Burger', 'Juicy beef patty with lettuce, tomato, and special sauce', 29900, TRUE),
('Veggie Wrap', 'Fresh vegetables, hummus, and feta cheese in a warm tortilla', 19900, TRUE),
('Chicken Biryani', 'Aromatic rice dish with tender chicken pieces', 24900, TRUE),
('Masala Dosa', 'Crispy South Indian crepe filled with spiced potatoes', 14900, TRUE),
('Fries', 'Crispy golden fries with a dash of salt', 9900, TRUE),
('Cold Coffee', 'Refreshing cold coffee with ice cream', 12900, TRUE);
```

3. Set up Clerk authentication
   - Create a Clerk account at [clerk.dev](https://clerk.dev)
   - Add your domain to the allowed list
   - Configure email/SMS providers
   - Set email domain restrictions to @yourcollege.edu

4. Configure Supabase Auth policies
   
5. Deploy Edge Functions for API routes

## API Routes / Edge Functions

The following API routes should be implemented as Supabase Edge Functions:

- `POST /api/checkout` - Create Razorpay order
- `POST /api/orders` - Insert into orders table
- `POST /api/deliveries` - Assign delivery
- `POST /api/deliveries/:id/complete` - Complete delivery and update earnings

## Deployment

1. Build the application
   ```bash
   npm run build
   # or
   yarn build
   ```

2. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
