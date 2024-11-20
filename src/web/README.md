# Case Interview Practice Platform - Web Frontend

A modern web application built with NextJS 13+, React 18+, and TypeScript 5.0+ for practicing case interview skills through structured drills and simulations.

## Project Overview

The Case Interview Practice Platform is a comprehensive web application designed to help aspiring consultants prepare for case interviews through:

- Interactive case interview drills with AI-powered feedback
- McKinsey-style ecosystem simulation game
- Structured practice modules for various case skills
- Real-time performance tracking and analytics

### Technology Stack

- NextJS 13+ (App Router)
- React 18+
- TypeScript 5.0+
- TailwindCSS 3.0+
- Supabase for authentication and data storage
- Shadcn/ui for component library

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended package manager)
- Supabase account for database and authentication

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd case-interview-platform/src/web

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
```

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Commands

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Run linting
pnpm lint

# Type checking
pnpm type-check
```

## Development

### Project Structure

```
src/web/
├── app/                 # Next.js 13 App Router pages
├── components/          # Reusable React components
├── lib/                 # Utility functions and shared logic
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── styles/             # Global styles and Tailwind config
├── public/             # Static assets
└── tests/              # Test files
```

### Coding Standards

- TypeScript strict mode enabled
- ESLint configuration with recommended rules
- Prettier for code formatting
- Component-Driven Development (CDD) approach
- Atomic design principles for components

### Component Guidelines

- Use functional components with hooks
- Implement proper TypeScript types
- Follow accessibility best practices (WCAG 2.1)
- Maintain proper component documentation
- Utilize Shadcn/ui components where applicable

## Testing

### Unit Testing

- Jest and React Testing Library
- Test coverage requirements: 80%
- Run tests: `pnpm test`
- Watch mode: `pnpm test:watch`
- Coverage report: `pnpm test:coverage`

### Integration Testing

- API integration tests
- Component integration tests
- Mock service worker (MSW) for API mocking
- Run in test environment with mock data

### E2E Testing

- Playwright for end-to-end testing
- Cross-browser testing (Chrome, Firefox, Safari)
- Critical user flow validation
- Run E2E tests: `pnpm test:e2e`

## Deployment

### Build Process

1. Type checking and linting
2. Unit and integration tests
3. NextJS production build
4. Asset optimization
5. Deployment to Vercel

### Environment Configuration

- Development: Local environment
- Staging: Preview deployments
- Production: Production environment

### Deployment Workflow

1. Push to feature branch
2. Automated tests in CI
3. Preview deployment
4. Pull request review
5. Merge to main
6. Production deployment

### Monitoring and Analytics

- Vercel Analytics for performance monitoring
- Error tracking with Sentry
- User analytics with Mixpanel
- Real-time monitoring dashboard

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request
5. Wait for review and approval

## License

Private - All rights reserved

---

For detailed documentation on specific features and components, please refer to the `/docs` directory.