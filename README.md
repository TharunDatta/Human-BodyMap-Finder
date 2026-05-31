# BodyMap - Next.js Medical Appointment Booking

A modern medical appointment booking system with interactive 3D body mapping, doctor scheduling, and persistent database storage via Supabase.

## Stack

- **Frontend**: Next.js 14 (TypeScript), React 18, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), API Routes
- **Hosting**: Vercel
- **Icons**: Material Design Symbols
- **Fonts**: Manrope (Headlines), Inter (Body)

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier: https://supabase.com)
- Vercel account (optional, for hosting)

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at https://app.supabase.com
2. Get your project's `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Update `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### 3. Set Up Database Schema

Run the following SQL in Supabase SQL Editor:

```sql
-- Doctors table
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  rating FLOAT DEFAULT 4.5,
  experience INTEGER,
  image TEXT,
  location TEXT,
  languages TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  firstName TEXT,
  lastName TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id),
  doctorId UUID NOT NULL REFERENCES doctors(id),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'confirmed',
  referenceNumber TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row-Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow public read of doctors
CREATE POLICY "Doctors are visible to everyone" 
  ON doctors FOR SELECT 
  USING (true);

-- Users can read their own data
CREATE POLICY "Users can read own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Users can read their own bookings
CREATE POLICY "Users can read own bookings" 
  ON bookings FOR SELECT 
  USING (auth.uid() = userId);
```

### 4. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
app/
├── layout.tsx                 # Root layout
├── page.tsx                   # Homepage
├── globals.css                # Global styles + Tailwind
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── doctors/
│   ├── page.tsx               # Doctors list
│   └── [id]/page.tsx          # Doctor detail with scheduling
├── booking/page.tsx           # Booking confirmation
├── explore/page.tsx           # 3D body mapping
├── profile/page.tsx           # User appointments
└── api/
    ├── doctors/
    │   ├── route.ts           # GET /api/doctors
    │   └── [id]/route.ts      # GET /api/doctors/:id
    ├── bookings/
    │   └── route.ts           # POST booking, GET user bookings
    └── auth/
        └── login.ts           # POST login

lib/
├── supabase.ts                # Supabase client & types
└── dateUtils.ts               # Date calculation utilities
```

## Key Features

### Doctor Scheduling
- Interactive 7-day week calendar (Sunday-Saturday)
- Morning (9 AM - 12 PM) and Afternoon (2 PM - 5 PM) slots
- Past dates automatically disabled
- One-click date + time selection with visual feedback
- Bottom booking bar appears only when both date and time selected

### Booking Flow
1. Navigate to Doctors list (via 3D body mapping or direct)
2. Click doctor card to view details & schedule
3. Select date (highlights in teal when clicked)
4. Select time slot (bottom booking bar appears)
5. Confirm booking → Database insertion → Confirmation page
6. View appointment in Profile page

### Authentication
- Email + Password registration
- Login session persistence (Supabase Auth)
- Profile page shows user's appointments from database

## Development

### Build for Production

```bash
npm run build
npm start
```

### Lint Code

```bash
npm run lint
```

## Deployment to Vercel

1. Push project to GitHub
2. Connect repo to Vercel at https://vercel.com/new
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy with one click

## Styling

Uses Tailwind CSS with custom theme colors from Material Design 3 palette:
- **Primary**: Teal (`#1f6a60`)
- **Secondary**: Slate Green (`#4b645f`)
- **Error**: Red (`#a83836`)
- **Background**: Light Gray (`#f8f9fb`)

All colors available via Tailwind utility classes, e.g., `bg-primary`, `text-on-background`.

## Troubleshooting

### Environment Variables Not Loading
- Ensure `.env.local` exists in project root
- Restart dev server after updating `.env.local`
- Check variable names start with `NEXT_PUBLIC_` for client-side access

### Database Connection Issues
- Verify Supabase URL and key are correct
- Check Supabase project is active (not paused)
- Check database RLS policies allow intended access

### Styling Not Applied
- Run `npm install` to ensure Tailwind is installed
- Verify `tailwind.config.ts` includes correct content paths
- Restart dev server

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel Deployment](https://vercel.com/docs)

## License

MIT
