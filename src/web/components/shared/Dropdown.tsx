/**
 * Human Tasks:
 * 1. Verify that keyboard navigation works correctly across different browsers
 * 2. Test focus management with screen readers
 * 3. Validate color contrast ratios in different dropdown states
 * 4. Ensure proper touch target sizes on mobile devices
 */

// react v18.x
import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
// class-variance-authority v0.7.0
import { clsx } from 'clsx';
// lucide-react v0.284.0
import { ChevronDown } from 'lucide-react';
import { colors, shadows } from '../../config/theme';

// Types for dropdown options and props
interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  label: string;
  disabled?: boolean;
  placeholder?: string;
  options: DropdownOption[];
  value: string | null;
  className?: string;
  onChange: (value: string) => void;
}

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  selectedValue: string | null;
  containerRef: React.RefObject<HTMLDivElement>;
  handleSelect: (value: string) => void;
}

// Utility function to replace cn from class-variance-authority
const cn = (...inputs: (string | undefined | null | boolean | { [key: string]: boolean })[]) => clsx(inputs);

// Requirement: Component Library - Create dropdown context
const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

// Requirement: Accessibility Requirements - WCAG 2.1 AA compliant dropdown
const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  ({ label, disabled = false, placeholder = 'Select an option', options, value, className = '', onChange }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionsRef = useRef<Array<HTMLLIElement | null>>([]);

    // Requirement: Accessibility Requirements - Handle click outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    };

    const handleSelect = (selectedValue: string) => {
      onChange(selectedValue);
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    // Requirement: Accessibility Requirements - Keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return;

      const currentIndex = options.findIndex(option => option.value === value);
      let nextIndex: number;

      switch (event.key) {
        case ' ':
        case 'Enter':
          event.preventDefault();
          if (isOpen && document.activeElement?.getAttribute('role') === 'option') {
            const selectedValue = (document.activeElement as HTMLElement).getAttribute('data-value');
            if (selectedValue) handleSelect(selectedValue);
          } else {
            setIsOpen(!isOpen);
          }
          break;

        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;

        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            nextIndex = currentIndex + 1 >= options.length ? 0 : currentIndex + 1;
            optionsRef.current[nextIndex]?.focus();
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            nextIndex = currentIndex - 1 < 0 ? options.length - 1 : currentIndex - 1;
            optionsRef.current[nextIndex]?.focus();
          }
          break;

        case 'Home':
          event.preventDefault();
          if (isOpen) {
            optionsRef.current[0]?.focus();
          }
          break;

        case 'End':
          event.preventDefault();
          if (isOpen) {
            optionsRef.current[options.length - 1]?.focus();
          }
          break;
      }
    };

    // Styles using theme tokens
    const dropdownStyles = cn(
      'relative w-full',
      {
        'opacity-50 cursor-not-allowed': disabled,
        'cursor-pointer': !disabled
      },
      className
    );

    const triggerStyles = cn(
      'flex items-center justify-between w-full px-4 py-2 text-left',
      'border rounded-md focus:outline-none focus:ring-2',
      'transition-colors duration-200',
      {
        'bg-white border-gray-300': !disabled,
        'hover:border-primary-hover': !disabled && !isOpen,
        'border-primary-active ring-primary-base': isOpen && !disabled,
        'bg-gray-100 border-gray-200': disabled
      }
    );

    const menuStyles = cn(
      'absolute z-50 w-full mt-1 bg-white',
      'border rounded-md shadow-md',
      'max-h-60 overflow-auto',
      {
        'hidden': !isOpen,
        [shadows.md]: true
      }
    );

    const optionStyles = (isSelected: boolean, isDisabled: boolean) => cn(
      'px-4 py-2 cursor-pointer',
      'focus:outline-none focus:bg-gray-100',
      {
        'bg-primary-base text-white': isSelected && !isDisabled,
        'text-gray-900': !isSelected && !isDisabled,
        'text-gray-400 cursor-not-allowed': isDisabled,
        'hover:bg-gray-100': !isSelected && !isDisabled
      }
    );

    return (
      <DropdownContext.Provider value={{ isOpen, setIsOpen, selectedValue: value, containerRef, handleSelect }}>
        <div
          ref={ref}
          className={dropdownStyles}
          onKeyDown={handleKeyDown}
        >
          <label
            id={`${label}-label`}
            className="block mb-2 text-sm font-medium text-gray-700"
          >
            {label}
          </label>
          <div ref={containerRef}>
            <button
              ref={triggerRef}
              type="button"
              className={triggerStyles}
              onClick={handleToggle}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              aria-labelledby={`${label}-label`}
              disabled={disabled}
            >
              <span className="truncate">
                {value ? options.find(opt => opt.value === value)?.label : placeholder}
              </span>
              <ChevronDown
                className={cn('w-4 h-4 transition-transform duration-200', {
                  'transform rotate-180': isOpen
                })}
              />
            </button>

            <ul
              role="listbox"
              className={menuStyles}
              aria-labelledby={`${label}-label`}
              tabIndex={-1}
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  ref={(el) => { optionsRef.current[index] = el }}
                  role="option"
                  className={optionStyles(value === option.value, !!option.disabled)}
                  aria-selected={value === option.value}
                  aria-disabled={option.disabled}
                  data-value={option.value}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  tabIndex={isOpen ? 0 : -1}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DropdownContext.Provider>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export default Dropdown;