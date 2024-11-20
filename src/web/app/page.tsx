'use client'

// Third-party imports
import Image from 'next/image' // ^13.0.0
import Link from 'next/link' // ^13.0.0

// Internal imports
import { Button } from '../components/shared/Button'
import { Card } from '../components/shared/Card'
import { Header } from '../components/layout/Header'

// Requirement: Landing Page Design - Feature showcase and metrics
const FEATURES = [
  {
    title: 'Case Prompt Drills',
    description: 'Practice with real consulting case scenarios',
    icon: '/images/case-icon.svg'
  },
  {
    title: 'Calculation Drills',
    description: 'Master case math and quick calculations',
    icon: '/images/math-icon.svg'
  },
  {
    title: 'Market Sizing',
    description: 'Learn structured estimation techniques',
    icon: '/images/market-icon.svg'
  },
  {
    title: 'McKinsey Simulation',
    description: 'Experience the digital assessment game',
    icon: '/images/simulation-icon.svg'
  }
]

// Requirement: Landing Page Design - Success metrics display
const METRICS = [
  {
    value: '80%',
    label: 'Completion Rate',
    description: 'Users completing practice drills'
  },
  {
    value: '4.8/5',
    label: 'User Satisfaction',
    description: 'Average platform rating'
  },
  {
    value: '200ms',
    label: 'Response Time',
    description: 'Average API response time'
  }
]

// Requirement: Landing Page Design - Main landing page component
export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900">
      {/* Requirement: Design System Implementation - Header with navigation */}
      <Header className="mb-16" />

      {/* Hero Section */}
      <section 
        className="px-4 pt-24 pb-16 md:pt-32 md:pb-24 max-w-7xl mx-auto"
        aria-labelledby="hero-heading"
      >
        <div className="text-center">
          <h1 
            id="hero-heading"
            className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Master Your McKinsey Interview
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Practice with real case scenarios, calculations, and simulations to prepare for your consulting career.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button variant="primary" size="lg">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section 
        className="px-4 py-16 bg-gray-50 dark:bg-gray-800"
        aria-labelledby="features-heading"
      >
        <div className="max-w-7xl mx-auto">
          <h2 
            id="features-heading"
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            Comprehensive Practice Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                hoverable
                className="p-6 text-center"
              >
                <div className="flex flex-col items-center">
                  <Image
                    src={feature.icon}
                    alt={feature.title}
                    width={48}
                    height={48}
                    className="mb-4"
                  />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* McKinsey Simulation Preview */}
      <section 
        className="px-4 py-16"
        aria-labelledby="simulation-heading"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 
                id="simulation-heading"
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6"
              >
                Experience the McKinsey Digital Assessment
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Practice with our simulation that replicates the actual McKinsey digital game. Make strategic decisions and analyze your performance in real-time.
              </p>
              <Link href="/simulation">
                <Button variant="primary" size="lg">
                  Try Simulation Demo
                </Button>
              </Link>
            </div>
            <div className="relative h-[400px]">
              <Image
                src="/images/simulation-preview.png"
                alt="McKinsey Digital Assessment Simulation"
                fill
                className="object-cover rounded-lg shadow-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Success Metrics */}
      <section 
        className="px-4 py-16 bg-gray-50 dark:bg-gray-800"
        aria-labelledby="metrics-heading"
      >
        <div className="max-w-7xl mx-auto">
          <h2 
            id="metrics-heading"
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            Platform Success Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {METRICS.map((metric) => (
              <Card
                key={metric.label}
                className="p-6 text-center"
              >
                <div className="flex flex-col items-center">
                  <span className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                    {metric.value}
                  </span>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {metric.label}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {metric.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section 
        className="px-4 py-16"
        aria-labelledby="cta-heading"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 
            id="cta-heading"
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Ready to Start Your Preparation?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of candidates who have successfully prepared for their consulting interviews using our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button variant="primary" size="lg">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/drills">
              <Button variant="secondary" size="lg">
                Explore Drills
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}