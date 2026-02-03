import React from 'react';
import { Users, Heart, Baby, Camera, Mountain, Leaf, Compass, User } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this utility is available for combining class names

// All possible target audience values from the data
export const AUDIENCE_OPTIONS = [
  { value: '親子', label: '親子', icon: Baby },
  { value: '文青', label: '文青', icon: User },
  { value: '情侶', label: '情侶', icon: Heart },
  { value: '攝影', label: '攝影', icon: Camera },
  { value: '登山', label: '登山', icon: Mountain },
  { value: '生態', label: '生態', icon: Leaf },
  { value: '冒險', label: '冒險', icon: Compass },
  { value: '銀髮', label: '銀髮', icon: Users },
] as const;

/**
 * @interface AudienceSelectorConfig
 * @description
 * Defines the configuration props for the AudienceSelector component.
 * This interface ensures the component is self-contained and configurable via props,
 * adhering to Kintone widget independence requirements by avoiding global store dependencies.
 */
interface AudienceSelectorConfig {
  /**
   * @property {string[]} value - An array of currently selected audience values.
   */
  value: string[];
  /**
   * @property {(audiences: string[]) => void} onChange - Callback function triggered when the selection changes.
   * Receives the updated array of selected audience values.
   */
  onChange: (audiences: string[]) => void;
  /**
   * @property {string} [className] - Optional Tailwind CSS classes to apply to the outermost container
   * (the Card structure) for custom styling or layout.
   */
  className?: string;
}

/**
 * @component AudienceSelector
 * @description
 * A selector component for choosing target audiences.
 * It provides a list of predefined audience options with icons and allows multiple selections.
 *
 * This component is designed to be Kintone independent, receiving all necessary data and callbacks
 * through its props. It adheres to Dashtail UI norms, using semantic Tailwind tokens for colors,
 * incorporating a standard Card structure, and including a `.drag-handle` for widget movability.
 *
 * @param {AudienceSelectorConfig} props - Configuration props for the component.
 * @returns {React.FC} The AudienceSelector component.
 */
export default function AudienceSelector({ value, onChange, className }: AudienceSelectorConfig) {
  const toggleAudience = (audience: string) => {
    if (value.includes(audience)) {
      onChange(value.filter(a => a !== audience));
    } else {
      onChange([...value, audience]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    // [Dashtail UI] Standard Card structure for widgets
    <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm p-4", className)}>
      {/* [Dashtail UI] Drag-handle structure for widget movability */}
      <div className="flex items-center justify-between pb-3 drag-handle">
        {/* [Dashtail UI] Use semantic text colors and appropriate font weight */}
        <span className="text-sm font-semibold text-muted-foreground">客群篩選</span>
        {value.length > 0 && (
          <button
            onClick={clearAll}
            // [Dashtail UI] Use semantic text colors for button states
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            清除全部
          </button>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {AUDIENCE_OPTIONS.map(({ value: audience, label, icon: Icon }) => {
          const isActive = value.includes(audience);
          return (
            <button
              key={audience}
              onClick={() => toggleAudience(audience)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5',
                isActive
                  ? 'bg-primary text-primary-foreground' // [Dashtail UI] Use primary colors for active state
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80' // [Dashtail UI] Use secondary colors for inactive state
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}