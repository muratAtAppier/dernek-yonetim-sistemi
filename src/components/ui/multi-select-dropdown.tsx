'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'
import { Checkbox } from './checkbox'

export interface MultiSelectOption {
  value: string
  label: string
}

export interface MultiSelectDropdownProps {
  name: string
  options: MultiSelectOption[]
  defaultValue?: string[]
  placeholder?: string
  allOptionValue?: string
  className?: string
}

export function MultiSelectDropdown({
  name,
  options,
  defaultValue = [],
  placeholder = 'Seçiniz...',
  allOptionValue = '__ALL__',
  className,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValues, setSelectedValues] =
    React.useState<string[]>(defaultValue)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Check if all option is selected
  const isAllSelected = selectedValues.includes(allOptionValue)

  // Get display text
  const getDisplayText = () => {
    if (isAllSelected) {
      const allOption = options.find((opt) => opt.value === allOptionValue)
      return allOption?.label || placeholder
    }
    if (selectedValues.length === 0) {
      return placeholder
    }
    const labels = selectedValues
      .map((val) => options.find((opt) => opt.value === val)?.label)
      .filter(Boolean)
    if (labels.length === 1) return labels[0]
    return `${labels.length} seçili`
  }

  // Handle checkbox change
  const handleCheckboxChange = (value: string, checked: boolean) => {
    setSelectedValues((prev) => {
      let newValues: string[]

      if (value === allOptionValue) {
        // If "All" is clicked
        if (checked) {
          // Select all options
          newValues = [allOptionValue]
        } else {
          // Deselect all
          newValues = []
        }
      } else {
        // If a regular option is clicked
        if (checked) {
          // Add the value, remove "All" if it was selected
          newValues = [...prev.filter((v) => v !== allOptionValue), value]
        } else {
          // Remove the value and also remove "All" if it was selected
          newValues = prev.filter((v) => v !== value && v !== allOptionValue)
        }
      }

      return newValues
    })
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Hidden inputs for form submission */}
      {selectedValues.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}

      {/* Display button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !isAllSelected &&
            selectedValues.length === 0 &&
            'text-muted-foreground'
        )}
      >
        <span className="truncate">{getDisplayText()}</span>
        <svg
          className={cn(
            'h-4 w-4 opacity-50 transition-transform',
            isOpen && 'rotate-180'
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full rounded-md border border-input bg-background shadow-lg">
          <div className="max-h-[300px] overflow-auto p-1">
            {options.map((option) => {
              const isChecked = isAllSelected
                ? option.value === allOptionValue
                : selectedValues.includes(option.value)

              return (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-center gap-2 rounded-sm px-2 py-2 text-sm cursor-pointer',
                    'hover:bg-accent hover:text-accent-foreground',
                    'transition-colors'
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    onChange={(e) =>
                      handleCheckboxChange(option.value, e.target.checked)
                    }
                  />
                  <span className="flex-1">{option.label}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
