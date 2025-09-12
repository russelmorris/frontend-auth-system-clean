'use client';

import * as React from 'react';
import { X, Check, ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

  // Filter options based on input
  const filteredOptions = React.useMemo(() => {
    if (!inputValue) return options;
    return options.filter((option) =>
      option.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue]);

  // Get unique options
  const uniqueOptions = React.useMemo(() => {
    return Array.from(new Set(options));
  }, [options]);

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const handleClear = () => {
    onChange([]);
    setInputValue('');
  };

  const handleSelectAll = () => {
    if (selected.length === uniqueOptions.length) {
      onChange([]);
    } else {
      onChange(uniqueOptions);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between text-left font-normal',
            !selected.length && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length > 0 ? (
              selected.length <= 2 ? (
                selected.map((item) => (
                  <Badge
                    variant="secondary"
                    key={item}
                    className="mr-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(item);
                    }}
                  >
                    {item}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary">
                  {selected.length} selected
                </Badge>
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-white dark:bg-gray-800 border shadow-lg" align="start">
        <div className="p-2 border-b bg-white dark:bg-gray-800">
          <Input
            placeholder="Type to filter..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="p-2 border-b flex gap-2 bg-white dark:bg-gray-800">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs"
          >
            {selected.length === uniqueOptions.length ? 'Deselect All' : 'Select All'}
          </Button>
          {selected.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-xs"
            >
              Clear
            </Button>
          )}
        </div>
        <div className="max-h-60 overflow-auto p-1 bg-white dark:bg-gray-800">
          {filteredOptions.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">No results found</p>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option}
                className={cn(
                  'flex items-center space-x-2 rounded-sm px-2 py-1 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground',
                  selected.includes(option) && 'bg-accent'
                )}
                onClick={() => handleSelect(option)}
              >
                <div
                  className={cn(
                    'h-4 w-4 border rounded-sm flex items-center justify-center',
                    selected.includes(option)
                      ? 'bg-primary border-primary'
                      : 'border-input'
                  )}
                >
                  {selected.includes(option) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <span>{option}</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}