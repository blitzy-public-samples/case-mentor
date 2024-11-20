# Case Interview Practice Platform Backend

A NextJS-based serverless backend with edge functions powering the Case Interview Practice Platform.

## Project Overview

The Case Interview Practice Platform backend provides a robust, scalable infrastructure for delivering AI-powered case interview practice and evaluation. Built on NextJS 13+ with App Router, the system leverages edge functions for optimal performance and global accessibility.

Key Features:
- AI-powered evaluation system using OpenAI API
- Real-time drill execution with edge functions
- McKinsey simulation engine
- Subscription management via Stripe
- Performance analytics with Supabase
- Transactional emails using Resend

## Getting Started

### Prerequisites

> [!IMPORTANT]
> Ensure you have the following installed:
- Node.js >= 18.0.0 LTS
- pnpm >= 8.0.0
- TypeScript ^5.0.0

### Environment Setup

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
RESEND_API_KEY=your_resend_api_key
```

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

### Development Scripts

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate test coverage report
pnpm test:coverage

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Type check
pnpm type-check
```

## Architecture

The backend follows a serverless architecture leveraging NextJS 13+ App Router and edge functions for optimal performance and scalability.

### Core Components

1. **API Layer**
   - NextJS Edge Functions for API routes
   - Request validation using Zod
   - Rate limiting and caching
   - Authentication via Supabase

2. **Database Layer**
   - Supabase PostgreSQL for data persistence
   - Real-time subscriptions for live updates
   - Row-level security policies
   - Automated backups

3. **AI Evaluation System**
   - OpenAI GPT-4 integration
   - Response analysis and scoring
   - Performance metrics generation
   - Feedback synthesis

4. **Payment Processing**
   - Stripe integration for subscriptions
   - Webhook handling
   - Payment status tracking
   - Invoice generation

5. **Email System**
   - Transactional emails via Resend
   - Email templates using MJML
   - Delivery tracking
   - Bounce handling

## Development

### Project Structure

```
src/backend/
├── app/              # Next.js App Router
│   ├── api/         # API routes
│   └── routes/      # Page routes
├── lib/             # Shared utilities
├── models/          # Data models
├── services/        # Business logic
├── types/           # TypeScript types
└── utils/           # Helper functions
```

### Coding Standards

- TypeScript strict mode enabled
- ESLint configuration with recommended rules
- Prettier for code formatting
- Jest for testing
- Conventional commits

### Best Practices

1. **Error Handling**
   - Use custom error classes
   - Implement error boundaries
   - Structured error responses

2. **Performance**
   - Implement caching strategies
   - Optimize database queries
   - Minimize API response size

3. **Security**
   - Input validation
   - Rate limiting
   - CORS configuration
   - Authentication checks

## API Documentation

### Authentication

All API routes require authentication unless explicitly marked as public.

```typescript
// Authentication header format
Authorization: Bearer <jwt_token>
```

### API Endpoints

#### Drills API

```typescript
// Get available drills
GET /api/drills

// Get specific drill
GET /api/drills/:id

// Submit drill attempt
POST /api/drills/:id/attempt
```

#### Simulation API

```typescript
// Start simulation
POST /api/simulation/start

// Submit simulation step
POST /api/simulation/:id/step

// End simulation
POST /api/simulation/:id/end
```

#### User API

```typescript
// Get user profile
GET /api/user

// Update user profile
PATCH /api/user

// Get user progress
GET /api/user/progress
```

## Deployment

### Production Deployment

The application is deployed on Vercel's Edge Network.

1. **Environment Configuration**
   - Set up production environment variables
   - Configure domain settings
   - Set up monitoring

2. **Database Migration**
   - Run production migrations
   - Verify data integrity
   - Set up backup schedule

3. **Monitoring Setup**
   - Configure error tracking
   - Set up performance monitoring
   - Enable logging

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] API endpoints tested
- [ ] Security headers verified
- [ ] SSL certificates valid
- [ ] Monitoring active
- [ ] Backup system configured
- [ ] Documentation updated

### Scaling Considerations

- Edge function distribution
- Database connection pooling
- Cache optimization
- Rate limiting configuration
- Load balancing setup

## Support

For technical support or questions:
1. Check existing documentation
2. Review issue tracker
3. Contact development team

---

*This backend implementation addresses requirements from sections 4.1 (Backend Technology Stack), 4.5 (Development Environment), 5.1 (System Architecture), and 4.2 (Core Frameworks) of the technical specification.*