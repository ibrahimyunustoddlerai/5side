# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FiveSide is a 5-a-side football pitch booking platform built with Next.js 14, inspired by Playtomic. It features map-based search, real-time bookings with Stripe payments, and venue management tools.

**Tech Stack:**
- Next.js 14 (App Router) with TypeScript
- Prisma ORM + PostgreSQL (Supabase)
- Supabase Auth
- Stripe (payments + webhooks)
- Google Maps Platform
- Resend (emails) + React Email
- Upstash Redis (rate limiting)
- Tailwind CSS + shadcn/ui
- Vitest (unit tests) + Playwright (e2e tests)

## Development Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking

# Testing
npm run test             # Run unit tests (Vitest)
npm run test:watch       # Run unit tests in watch mode
npm run test:e2e         # Run e2e tests (Playwright)
npm run test:e2e:ui      # Run e2e tests with UI

# Database (Prisma)
npm run db:generate      # Generate Prisma client (required after schema changes)
npm run db:push          # Push schema to database (dev/prototyping)
npm run db:migrate       # Create and run migrations (production workflow)
npm run db:studio        # Open Prisma Studio (GUI)
npm run db:seed          # Seed database with test data
```

## Architecture & Key Patterns

### Application Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── (auth)/            # Auth-protected routes
│   ├── api/               # API endpoints (search, webhooks)
│   ├── search/            # Public search interface
│   └── login/             # Authentication
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── search/            # Search-related components
│   └── auth/              # Authentication components
├── lib/
│   ├── availability.ts    # Core availability/slot calculation logic
│   ├── auth.ts            # Server-side auth helpers
│   ├── prisma.ts          # Prisma client singleton
│   ├── supabase/          # Supabase client factories (client/server/middleware)
│   ├── stripe.ts          # Stripe configuration
│   ├── geo.ts             # Geospatial utilities
│   └── rateLimit.ts       # Upstash rate limiting
└── types/                 # Shared TypeScript types
```

### Authentication Pattern

- **Supabase Auth** handles user authentication
- Server components: use `createClient()` from `@/lib/supabase/server`
- Client components: use `createClient()` from `@/lib/supabase/client`
- Auth helpers in `src/lib/auth.ts`: `getUser()`, `requireAuth()`, `getSession()`
- Middleware (`middleware.ts`) updates Supabase session on every request

### Database Access

- **Prisma client**: Import from `@/lib/prisma` (singleton pattern)
- **Multi-tenancy**: Organizations own Locations, which own Pitches
- **User-Organization relationship**: `UserOrganization` table links Supabase users to Organizations with roles
- **Timezone handling**: All booking times stored in UTC; timezone conversion happens in `src/lib/availability.ts`

### Availability System

The availability calculation logic (`src/lib/availability.ts`) is critical:

1. **Schedule-based**: `PitchSchedule` defines operating hours per day of week
2. **Timezone-aware**: Converts dates to venue timezone, then back to UTC for storage
3. **Closure handling**: Checks both `LocationClosure` and `PitchClosure`
4. **Conflict detection**: `isSlotAvailable()` checks for overlapping bookings
5. **Slot generation**: Creates hourly slots based on schedule, marks availability

### Payment Flow

1. Customer books → Stripe Checkout Session created
2. Booking status: `PENDING` (with `stripe_session_id`)
3. Stripe webhook (`/api/webhooks/stripe`) confirms payment
4. Booking status updated to `CONFIRMED`
5. Email confirmation sent via Resend

### API Routes

- **Public APIs**: `/api/search`, `/api/locations/[id]`, `/api/pitches/[id]/availability`
- **Webhooks**: `/api/webhooks/stripe` (Stripe payment events)
- **Rate limiting**: Applied to booking/search endpoints via Upstash Redis

## Important Patterns & Constraints

### Database Constraints

- Anti-double-booking enforced via query logic (check `isSlotAvailable()`)
- Cascade deletes: Organization → Location → Pitch → Bookings
- Prices stored in **pence** (e.g., £10 = 1000 pence)

### Timezone Handling

- **All database timestamps are UTC**
- Convert to venue timezone only for display/availability calculation
- Use `date-fns-tz` functions: `toZonedTime()`, `fromZonedTime()`
- Default timezone: `Europe/London`

### Supabase Integration

- User IDs in `UserOrganization.user_id` and `Booking.organizer_user_id` reference Supabase `auth.users`
- Auth state managed via cookies (SSR-friendly)
- Middleware pattern required for auth refresh

### Environment Variables

Required for local development (see `.env.example`):
- `DATABASE_URL` (Supabase PostgreSQL)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `GOOGLE_MAPS_SERVER_API_KEY`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

## Testing Strategy

- **Unit tests**: Located in `__tests__` directories, use Vitest + jsdom
- **E2E tests**: Located in `tests/e2e/`, use Playwright
- **Path alias**: `@/` maps to `src/`
- **E2E setup**: Runs dev server automatically (`npm run dev` via webServer config)

## Common Tasks

### Adding a new API route
1. Create in `src/app/api/[route]/route.ts`
2. Export `GET`, `POST`, etc. as async functions
3. Use `NextRequest`/`NextResponse` types
4. Add rate limiting if needed (see `src/lib/rateLimit.ts`)

### Modifying database schema
1. Edit `prisma/schema.prisma`
2. Run `npm run db:generate` to update Prisma client
3. Use `npm run db:push` (dev) or `npm run db:migrate` (production)

### Working with Stripe webhooks
- Webhook handler: `src/app/api/webhooks/stripe/route.ts`
- Verify signature using `STRIPE_WEBHOOK_SECRET`
- Handle events: `checkout.session.completed`, `payment_intent.succeeded`, etc.
- Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Adding shadcn/ui components
```bash
npx shadcn-ui@latest add [component-name]
```
Components added to `src/components/ui/`
