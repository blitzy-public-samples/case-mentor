'use client'

// Third-party imports
import Image, { StaticImageData } from 'next/image'; // Import StaticImageData
import Link from 'next/link'; // ^13.0.0

// Internal imports
import { Button } from '../components/shared/Button';
import { Card } from '../components/shared/Card';
import { Header } from '../components/layout/Header';

// Image Imports
import BusinessPerson from '../../assets/images/business-person.png';
import Calculator from '../../assets/images/calculator.png';
import MarketSizing from '../../assets/images/market-sizing.png';
import Network from '../../assets/images/network.png';

// Features Data
const FEATURES = [
  {
    title: 'Case Prompt Drills',
    description: 'Practice with real consulting case scenarios',
    icon: BusinessPerson,
  },
  {
    title: 'Calculation Drills',
    description: 'Master case math and quick calculations',
    icon: Calculator,
  },
  {
    title: 'Market Sizing',
    description: 'Learn structured estimation techniques',
    icon: MarketSizing,
  },
  {
    title: 'McKinsey Simulation',
    description: 'Experience the digital assessment game',
    icon: Network,
  },
];

// Metrics Data
const METRICS = [
  {
    value: '80%',
    label: 'Completion Rate',
    description: 'Users completing practice drills',
  },
  {
    value: '4.8/5',
    label: 'User Satisfaction',
    description: 'Average platform rating',
  },
  {
    value: '200ms',
    label: 'Response Time',
    description: 'Average API response time',
  },
];

// FeatureCard Component
function FeatureCard({ 
  title, 
  description, 
  icon 
}: { 
  title: string; 
  description: string; 
  icon: StaticImageData; 
}) {
  return (
    <Card hoverable className="p-6 text-center">
      <div className="flex flex-col items-center">
        <Image
          src={icon} // icon is of type StaticImageData
          alt={title}
          width={48}
          height={48}
          className="mb-4"
        />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-primary mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    </Card>
  );
}

// MetricCard Component
function MetricCard({ value, label, description }: { value: string; label: string; description: string }) {
  return (
    <Card className="p-6 text-center">
      <div className="flex flex-col items-center">
        <span className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">{value}</span>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-primary mb-2">{label}</h3>
        <p className="text-gray-600 dark:text-gray-300">{description}</p>
      </div>
    </Card>
  );
}

// HomePage Component
export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <Header className="m-0" />

      {/* Add top padding to account for header */}
      <main className="flex-grow pt-16">
        {/* Hero Section */}
        <section
  className="relative flex flex-col justify-center items-center px-4 md:px-8 py-20 bg-gradient-to-br from-green-100 via-green-50 to-green-200"
  aria-labelledby="hero-heading"
>
  <div className="text-center flex flex-col items-center max-w-screen-md mx-auto">
    <h1
      id="hero-heading"
      className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-8"
    >
      Master Your McKinsey Interview
    </h1>
    <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 max-w-2xl mb-6">
      Practice with real case scenarios, calculations, and simulations to prepare for your consulting career.
    </p>
    <div className="flex flex-wrap gap-6 justify-center -mt-4">
      <Link href="/register">
        <Button
          variant="primary"
          size="md"
          className="bg-green-600 text-white px-6 py-3 rounded-md transition-transform duration-300 hover:bg-red-600 hover:text-white"
        >
          Start Free Trial
        </Button>
      </Link>
      <Link href="/login">
        <Button
          variant="primary"
          size="md"
          className="bg-green-300 text-gray-800 px-6 py-3 rounded-md transition-transform duration-300 hover:bg-red-600 hover:text-white"
        >
          Sign In
        </Button>
      </Link>
    </div>
  </div>
</section>


        {/* Features Grid */}
        <section
          className="px-4 py-16 bg-gray-50 dark:bg-gray-800 flex flex-col justify-center items-center min-h-[70vh]"
          aria-labelledby="features-heading"
        >
          <h2
            id="features-heading"
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mt-12 mb-12"
          >
            Comprehensive Practice Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
              />
            ))}
          </div>
        </section>

        {/* Success Metrics */}
        <section
          className="px-4 py-16 bg-gray-50 dark:bg-gray-800 flex flex-col justify-center items-center min-h-[70vh] text-center"
          aria-labelledby="metrics-heading"
        >
          <h2
            id="metrics-heading"
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mt-12 mb-12"
          >
            Platform Success Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {METRICS.map((metric) => (
              <MetricCard
                key={metric.label}
                value={metric.value}
                label={metric.label}
                description={metric.description}
              />
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section
          className="px-4 py-16 text-center flex flex-col justify-center items-center min-h-[70vh]"
        >
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-12 mb-6">
              Ready to Start Your Preparation?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Join thousands of candidates who have successfully prepared for their consulting interviews using our platform.
            </p>
            <div className="flex flex-wrap gap-6 justify-center mt-4 mb-8">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="md"
                  className="bg-green-600 text-white px-6 py-3 rounded-md transition-transform duration-300 hover:bg-red-600 hover:text-white"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/drills">
                <Button
                  variant="primary"
                  size="md"
                  className="bg-green-300 text-gray-800 px-6 py-3 rounded-md transition-transform duration-300 hover:bg-red-600 hover:text-white"
                >
                  Explore Drills
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white p-6 m-0">
        <p className="text-center">&copy; 2024 McKinsey Prep. All rights reserved.</p>
      </footer>
    </div>
  );
}
