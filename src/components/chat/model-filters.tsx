'use client'
import React, { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Zap, Eye, Globe, FileText, Brain, Settings2, ImagePlus, Check, Filter } from 'lucide-react';

interface FilterOption {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  colorDark: string;
}

interface MenuItemProps extends FilterOption {
  isChecked: boolean;
  onToggle: (id: string) => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ 
  id, 
  icon: Icon, 
  label, 
  color, 
  colorDark, 
  isChecked, 
  onToggle 
}) => (
  <div
    className="relative flex items-center justify-between cursor-pointer select-none rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent/30 hover:text-accent-foreground focus:bg-accent/30 focus:text-accent-foreground"
    role="menuitemcheckbox"
    aria-checked={isChecked}
    tabIndex={0}
    onClick={() => onToggle(id)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggle(id);
      }
    }}
  >
    <div className="-ml-0.5 flex items-center gap-2">
      <div
        className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-md"
        style={{ color, '--color-dark': colorDark } as React.CSSProperties}
      >
        <div className="absolute inset-0 bg-current opacity-20 dark:opacity-15" />
        <Icon className="h-4 w-4" />
      </div>
      <span>{label}</span>
    </div>
    <div className="flex h-3.5 w-3.5 items-center justify-center">
      {isChecked && (
          <Check className="h-3 w-3" />
      )}
    </div>
  </div>
);

const ModelFilters: React.FC = () => {
  const filterOptions: FilterOption[] = [
    {
      id: 'fast',
      icon: Zap,
      label: 'Fast',
      color: 'hsl(46 77% 52%)',
      colorDark: 'hsl(46 77% 79%)',
    },
    {
      id: 'vision',
      icon: Eye,
      label: 'Vision',
      color: 'hsl(168 54% 52%)',
      colorDark: 'hsl(168 54% 74%)',
    },
    {
      id: 'search',
      icon: Globe,
      label: 'Search',
      color: 'hsl(208 56% 52%)',
      colorDark: 'hsl(208 56% 74%)',
    },
    {
      id: 'pdfs',
      icon: FileText,
      label: 'PDFs',
      color: 'hsl(237 55% 57%)',
      colorDark: 'hsl(237 75% 77%)',
    },
    {
      id: 'reasoning',
      icon: Brain,
      label: 'Reasoning',
      color: 'hsl(263 58% 53%)',
      colorDark: 'hsl(263 58% 75%)',
    },
    {
      id: 'effort-control',
      icon: Settings2,
      label: 'Effort Control',
      color: 'hsl(304 44% 51%)',
      colorDark: 'hsl(304 44% 72%)',
    },
    {
      id: 'image-generation',
      icon: ImagePlus,
      label: 'Image Generation',
      color: 'hsl(12 60% 45%)',
      colorDark: 'hsl(12 60% 60%)',
    },
  ];

  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleFilter = (filterId: string) => {
    setSelectedFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filterId)) {
        newSet.delete(filterId);
      } else {
        newSet.add(filterId);
      }
      return newSet;
    });
  };

  const handleClearFilters = () => {
    setSelectedFilters(new Set());
  };

  const selectedCount = selectedFilters.size;

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className={`relative ${selectedCount > 0 ? 'bg-accent/50' : ''}`}
          >
            <Filter className="h-4 w-4" />
            {selectedCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {selectedCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="end"
          sideOffset={14}
          alignOffset={-10}
         className='min-w-[8rem] w-52 text-nowrap p-1'
        >
          {selectedCount > 0 && (
            <>
              <div className="flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground">
                <span>{selectedCount} selected</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-auto p-0 text-xs hover:bg-transparent hover:text-foreground"
                >
                  Clear filters
                </Button>
              </div>
              <div className="mx-1 h-px bg-border" />
            </>
          )}
          {filterOptions.map((option) => (
            <MenuItem
              key={option.id}
              {...option}
              isChecked={selectedFilters.has(option.id)}
              onToggle={handleToggleFilter}
            />
          ))}
        </PopoverContent>
      </Popover>
      
    </div>
  );
};

export default ModelFilters;