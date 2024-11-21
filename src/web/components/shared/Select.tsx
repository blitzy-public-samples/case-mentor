// React v18.0.0
import * as React from 'react';
// @radix-ui/react-select v2.0.0
import * as Select from '@radix-ui/react-select';
// class-variance-authority v0.7.0
import { cn } from 'class-variance-authority';

import { colors, shadows } from '../../config/theme';

/**
 * Human Tasks:
 * 1. Verify screen reader compatibility with popular screen readers (NVDA, VoiceOver, JAWS)
 * 2. Test keyboard navigation across different browsers and operating systems
 * 3. Validate color contrast ratios in all states (default, hover, focus, disabled)
 * 4. Ensure proper touch target sizes on mobile devices (minimum 44x44px)
 */

// Requirement: Component Library - Type definition for select options
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Requirement: Component Library - Props interface for Select component
interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

// Requirement: Component Library - Tailwind class definitions for select styling
const selectStyles = {
  trigger: [
    'flex h-10 w-full items-center justify-between rounded-md border px-3 py-2',
    'bg-white text-sm ring-offset-white transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'border-gray-200 hover:border-gray-300'
  ].join(' '),
  content: [
    'relative z-50 min-w-[8rem] overflow-hidden rounded-md',
    'border border-gray-200 bg-white text-gray-950 shadow-md',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
  ].join(' '),
  viewport: 'p-1',
  item: [
    'relative flex w-full cursor-default select-none items-center',
    'rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
    'focus:bg-gray-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
  ].join(' '),
  label: 'py-1.5 pl-8 pr-2 text-sm font-semibold',
  separator: '-mx-1 my-1 h-px bg-gray-100',
  indicator: 'absolute left-2 flex h-3.5 w-3.5 items-center justify-center'
};

// Requirement: Accessibility Requirements - WCAG 2.1 AA compliant Select component
export function Select({
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error,
  className
}: SelectProps): JSX.Element {
  // Requirement: Accessibility Requirements - Keyboard navigation state
  const [open, setOpen] = React.useState(false);

  // Requirement: Accessibility Requirements - Handle keyboard interactions
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
        if (!open) {
          setOpen(true);
        }
        break;
      case 'Escape':
        setOpen(false);
        break;
    }
  };

  return (
    <Select.Root
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
    >
      <Select.Trigger
        className={cn(
          selectStyles.trigger,
          error ? 'border-error-base' : 'border-gray-200',
          className
        )}
        aria-invalid={!!error}
        aria-describedby={error ? 'select-error' : undefined}
        onKeyDown={handleKeyDown}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="ml-2">
          <ChevronDownIcon className="h-4 w-4 opacity-50" />
        </Select.Icon>
      </Select.Trigger>
      
      {error && (
        <span id="select-error" className="mt-1 text-sm text-error-base">
          {error}
        </span>
      )}

      <Select.Portal>
        <Select.Content
          className={selectStyles.content}
          position="popper"
          sideOffset={4}
          style={{
            boxShadow: shadows.md
          }}
        >
          <Select.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-white">
            <ChevronUpIcon className="h-4 w-4" />
          </Select.ScrollUpButton>
          
          <Select.Viewport className={selectStyles.viewport}>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={selectStyles.item}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className={selectStyles.indicator}>
                  <CheckIcon className="h-4 w-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
          
          <Select.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-white">
            <ChevronDownIcon className="h-4 w-4" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

// Helper components for icons
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUpIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);