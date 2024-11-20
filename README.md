# Case Interview Practice Platform

![Build Status](https://img.shields.io/github/workflow/status/case-interview-platform/main/CI)
![Test Coverage](https://img.shields.io/codecov/c/github/case-interview-platform/main)
![License](https://img.shields.io/github/license/case-interview-platform)

A web-based platform designed to democratize access to high-quality consulting interview preparation through AI-powered feedback and gamification principles.

## Features

- 🎯 **Structured Practice Drills**
  - Case Prompt Analysis
  - Market Sizing Exercises
  - Calculation Drills
  - Brainstorming Sessions
  - Framework Application
  - Synthesis Practice

- 🎮 **McKinsey-Style Simulation**
  - Ecosystem Game Replication
  - Time-Pressured Scenarios
  - Complex Data Analysis
  - Real-Time Feedback

- 🤖 **AI-Powered Feedback**
  - Real-Time Response Evaluation
  - Structured Improvement Suggestions
  - Performance Analytics
  - Progress Tracking

- 📊 **Progress Tracking**
  - Skill Development Analytics
  - Performance Metrics
  - Improvement Trends
  - Targeted Practice Recommendations

## Technology Stack

### Frontend
- Next.js 13+ (App Router)
- React 18+
- TypeScript 5+
- TailwindCSS 3+
- shadcn/ui
- Framer Motion
- React Query
- Recharts

### Backend
- Supabase
- PostgreSQL
- Redis
- OpenAI GPT-4
- Stripe
- Resend

### Development Tools
- pnpm
- ESLint
- Jest
- Playwright
- MSW

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/case-interview-platform/main.git
cd case-interview-platform
```

2. Install dependencies
```bash
# Install frontend dependencies
cd src/web
pnpm install

# Install backend dependencies
cd ../backend
pnpm install
```

3. Set up environment variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key

# Backend (.env.local)
SUPABASE_SERVICE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_secret
RESEND_API_KEY=your_resend_key
```

4. Start development servers
```bash
# Frontend
cd src/web
pnpm dev

# Backend
cd src/backend
pnpm dev
```

## Development

### Code Style

- Follow TypeScript best practices
- Use ESLint for code linting
- Format with Prettier
- Follow React 18 patterns
- Write tests for new features

### Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run type checking
pnpm type-check
```

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `fix/*`: Bug fixes
- `release/*`: Release preparation

## Deployment

### Production Build

```bash
# Build frontend
cd src/web
pnpm build

# Build backend
cd src/backend
pnpm build
```

### Environment Configuration

Required environment variables for production:

```plaintext
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
RESEND_API_KEY=
```

### Deployment Process

1. Push to `main` branch
2. Automated CI/CD via GitHub Actions
3. Deploy to Vercel
4. Run post-deployment tests
5. Monitor application metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and development process.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.