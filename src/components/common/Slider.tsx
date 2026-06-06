import React from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  showValue?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  unit = '',
  showValue = true,
  className,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs text-surface-400 font-medium">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-xs text-surface-300 font-mono">
              {value}
              {unit}
            </span>
          )}
        </div>
      )}
      <div className="relative h-1">
        <div
          className="absolute left-0 top-0 h-1 bg-brand-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-1 appearance-none bg-transparent cursor-pointer z-10"
        />
      </div>
    </div>
  );
};
