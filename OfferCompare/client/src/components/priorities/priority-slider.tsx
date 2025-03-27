import { useState } from "react";
import { Slider } from "@/components/ui/slider";

interface PrioritySliderProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
}

export default function PrioritySlider({ label, value, onChange }: PrioritySliderProps) {
  // Use default value of 5 (medium) if value is null
  const defaultValue = value ?? 5;
  const [localValue, setLocalValue] = useState(defaultValue);
  
  // Handle slider change
  const handleChange = (newValue: number[]) => {
    const value = newValue[0];
    setLocalValue(value);
  };
  
  // Handle slider change end (to reduce API calls)
  const handleChangeEnd = (newValue: number[]) => {
    const value = newValue[0];
    onChange(value);
  };
  
  // Get priority text based on value
  const getPriorityText = (value: number) => {
    if (value >= 8) return "High Priority";
    if (value >= 5) return "Medium Priority";
    return "Low Priority";
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm text-neutral-600">{getPriorityText(localValue)}</span>
      </div>
      <Slider
        defaultValue={[defaultValue]}
        min={1}
        max={10}
        step={1}
        value={[localValue]}
        onValueChange={handleChange}
        onValueCommit={handleChangeEnd}
        className="h-2"
      />
    </div>
  );
}
