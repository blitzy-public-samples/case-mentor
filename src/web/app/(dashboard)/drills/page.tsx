// Third-party imports
import React from 'react'; // ^18.0.0
import { useRouter } from 'next/navigation'; // ^13.0.0

// Internal imports
import DrillCard from '../../components/drills/DrillCard';
import DrillFilter from '../../components/drills/DrillFilter';
import { useDrill } from '../../hooks/useDrill';
import { DrillType, DrillDifficulty } from '../../types/drills';

/**
 * Human Tasks:
 * 1. Verify subscription tier validation logic with backend team
 * 2. Test drill filtering performance with large datasets
 * 3. Monitor real-time progress update performance
 * 4. Validate WCAG 2.1 AA compliance for drill cards grid
 * 5. Test responsive layout across different screen sizes
 */

// Requirement: Practice Drills - Main page component for drill management
export default function DrillsPage() {
  const router = useRouter();

  // Initialize drill hook for data fetching and state management
  const { drills, loading, error, progress } = useDrill(DrillType.CASE_PROMPT);

  // Filter state management
  const [selectedType, setSelectedType] = React.useState<DrillType | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<DrillDifficulty | null>(null);
  const [selectedIndustry, setSelectedIndustry] = React.useState<string | null>(null);

  // Requirement: Practice Drills - Filter available industries from drill data
  const industries = React.useMemo(() => {
    if (!drills) return [];
    return Array.from(new Set(drills.map(drill => drill.industry))).sort();
  }, [drills]);

  // Requirement: Practice Drills - Apply filters to drill list
  const filteredDrills = React.useMemo(() => {
    if (!drills) return [];
    
    return drills.filter(drill => {
      const matchesType = !selectedType || drill.type === selectedType;
      const matchesDifficulty = !selectedDifficulty || drill.difficulty === selectedDifficulty;
      const matchesIndustry = !selectedIndustry || drill.industry === selectedIndustry;
      return matchesType && matchesDifficulty && matchesIndustry;
    });
  }, [drills, selectedType, selectedDifficulty, selectedIndustry]);

  // Requirement: Practice Drills - Handle filter changes
  const handleFilterChange = React.useCallback((
    type: DrillType | null,
    difficulty: DrillDifficulty | null,
    industry: string | null
  ) => {
    setSelectedType(type);
    setSelectedDifficulty(difficulty);
    setSelectedIndustry(industry);
  }, []);

  // Requirement: Practice Drills - Handle drill selection and navigation
  const handleDrillStart = React.useCallback((drillId: string) => {
    router.push(`/drills/${drillId}`);
  }, [router]);

  // Requirement: User Interface Design - Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Requirement: User Interface Design - Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-error-base text-lg font-medium mb-4">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Requirement: User Interface Design - Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Practice Drills
        </h1>
        <p className="text-gray-600">
          Master case interview skills with targeted practice drills
        </p>
      </div>

      {/* Requirement: Practice Drills - Filter controls */}
      <div className="mb-8">
        <DrillFilter
          selectedType={selectedType}
          selectedDifficulty={selectedDifficulty}
          selectedIndustry={selectedIndustry}
          onTypeChange={(type) => handleFilterChange(type, selectedDifficulty, selectedIndustry)}
          onDifficultyChange={(difficulty) => handleFilterChange(selectedType, difficulty, selectedIndustry)}
          onIndustryChange={(industry) => handleFilterChange(selectedType, selectedDifficulty, industry)}
          industries={industries}
        />
      </div>

      {/* Requirement: User Interface Design - Responsive drill grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrills.map((drill) => (
          <DrillCard
            key={drill.id}
            drill={drill}
            progress={progress}
            onStart={() => handleDrillStart(drill.id)}
            className="h-full"
          />
        ))}
      </div>

      {/* Requirement: User Interface Design - Empty state */}
      {filteredDrills.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            No drills match your selected filters
          </p>
          <button
            onClick={() => handleFilterChange(null, null, null)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}