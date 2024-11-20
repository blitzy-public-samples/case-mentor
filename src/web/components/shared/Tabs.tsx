// react v18.x
import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
// class-variance-authority v0.7.0
import { cva } from 'class-variance-authority';
import { colors, spacing } from '../../config/theme';

/**
 * Human Tasks:
 * 1. Test keyboard navigation across different browsers and screen readers
 * 2. Verify ARIA attributes with accessibility testing tools
 * 3. Test color contrast ratios in different color modes
 * 4. Validate tab behavior with assistive technologies
 */

// Requirement: Component Library - Core UI component for tab-based navigation
const tabsVariants = cva('flex w-full', {
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col'
    }
  }
});

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultValue: string;
  orientation?: 'horizontal' | 'vertical';
  children: React.ReactNode;
  onChange?: (value: string) => void;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

// Requirement: Accessibility Requirements - WCAG 2.1 AA compliant keyboard navigation
const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  orientation = 'horizontal',
  children,
  onChange,
  className
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    onChange?.(value);
  }, [onChange]);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange, orientation }}>
      <div 
        className={tabsVariants({ orientation, className })}
        aria-orientation={orientation}
        style={{ gap: `${spacing.base}px` }}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsList must be used within Tabs');

  const { orientation } = context;

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={`flex ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'} ${className || ''}`}
      style={{ 
        backgroundColor: colors.primary.disabled,
        borderRadius: `${spacing.base}px`,
        padding: `${spacing.base}px`
      }}
    >
      {children}
    </div>
  );
};

const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  children,
  className,
  disabled = false
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const { activeTab, setActiveTab, orientation } = context;
  const isSelected = activeTab === value;
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Requirement: Accessibility Requirements - WAI-ARIA compliant keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    const buttons = Array.from(
      buttonRef.current?.parentElement?.querySelectorAll('[role="tab"]:not([disabled])') || []
    );
    const index = buttons.indexOf(buttonRef.current as Element);
    const isHorizontal = orientation === 'horizontal';

    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        if (isHorizontal) nextIndex = index - 1;
        break;
      case 'ArrowRight':
        if (isHorizontal) nextIndex = index + 1;
        break;
      case 'ArrowUp':
        if (!isHorizontal) nextIndex = index - 1;
        break;
      case 'ArrowDown':
        if (!isHorizontal) nextIndex = index + 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = buttons.length - 1;
        break;
      default:
        return;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      nextIndex = (nextIndex + buttons.length) % buttons.length;
      const nextButton = buttons[nextIndex] as HTMLButtonElement;
      nextButton.click();
      nextButton.focus();
    }
  };

  return (
    <button
      ref={buttonRef}
      role="tab"
      aria-selected={isSelected}
      aria-controls={`panel-${value}`}
      tabIndex={isSelected ? 0 : -1}
      disabled={disabled}
      onClick={() => !disabled && setActiveTab(value)}
      onKeyDown={handleKeyDown}
      className={`
        px-${spacing.base * 2}px 
        py-${spacing.base}px 
        rounded-${spacing.base}px
        ${isSelected ? 'bg-primary-base text-white' : 'text-primary-base'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-primary-hover'}
        transition-colors
        ${className || ''}
      `}
      style={{
        backgroundColor: isSelected ? colors.primary.base : 'transparent',
        color: isSelected ? '#fff' : colors.primary.base
      }}
    >
      {children}
    </button>
  );
};

const TabsContent: React.FC<TabsContentProps> = ({
  value,
  children,
  className
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  const { activeTab } = context;
  const isActive = activeTab === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={`
        p-${spacing.base * 2}px
        ${className || ''}
      `}
    >
      {children}
    </div>
  );
};

Tabs.TabsList = TabsList;
Tabs.TabsTrigger = TabsTrigger;
Tabs.TabsContent = TabsContent;

export { Tabs, TabsList, TabsTrigger, TabsContent };
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps };