# FiveSide - 5-a-Side Football Pitch Booking Platform

A Playtomic-inspired platform for discovering and booking 5-a-side football pitches.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Payments**: Stripe Checkout + Webhooks
- **Maps**: Google Maps Platform
- **Email**: Resend with React Email
- **Rate Limiting**: Upstash Redis
- **Testing**: Vitest (unit), Playwright (e2e)

## Features

### Public Features
- Map-based pitch search and discovery
- Venue details with availability calendar
- Real-time booking with Stripe payments
- Email confirmations with .ics calendar attachments

### Manager Features
- Location and pitch management (CRUD)
- Opening hours and closure management
- Calendar with manual bookings and blocks
- Recurring booking series
- Basic revenue and usage analytics
- Staff role management

### Business Logic
- Timezone-aware availability system
- Lead time and cutoff policies
- Book-ahead limits
- Clear cancellation and refund policies
- Anti-double-booking with DB constraints

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Stripe account
- Google Maps API key
- Resend account
- Upstash Redis account

### Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   DATABASE_URL=your_supabase_database_url

   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # Google Maps
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   GOOGLE_MAPS_SERVER_API_KEY=your_google_maps_server_key

   # Resend
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com

   # Upstash Redis
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma client:
   ```bash
   npm run db:generate
   ```

3. Push database schema:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run unit tests
- `npm run test:watch` - Run unit tests in watch mode
- `npm run test:e2e` - Run end-to-end tests
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

## Database Schema

The database includes the following main entities:

- **Organizations**: Venue operators
- **Locations**: Physical venues
- **Pitches**: Individual bookable courts/pitches
- **Bookings**: Customer bookings
- **Payments**: Payment records
- **Schedules**: Operating hours
- **Closures**: Temporary closures

All tables include Row Level Security (RLS) for multi-tenancy.

## API Endpoints

### Public APIs
- `GET /api/search` - Search pitches
- `GET /api/locations/[id]` - Get location details
- `GET /api/pitches/[id]/availability` - Get pitch availability
- `POST /api/bookings` - Create booking

### Webhook APIs
- `POST /api/webhooks/stripe` - Stripe payment webhooks

## Deployment

1. Set up your production database
2. Configure environment variables
3. Deploy to your preferred platform (Vercel, Netlify, etc.)
4. Set up Stripe webhooks pointing to `/api/webhooks/stripe`

## Security Features

- Row Level Security (RLS) on all tables
- Rate limiting on booking and search endpoints
- Stripe webhook signature verification
- Input validation with Zod schemas
- Parameterized queries via Prisma

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

Test plan includes:
- Search functionality
- Venue details display
- Booking flow
- Payment processing
- Email confirmations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.