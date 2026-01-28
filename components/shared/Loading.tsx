import { cn } from '@/lib/utils';

/**
 * Configuration interface for the Loading component.
 * This adheres to the Kintone independence principle by making all configurations explicit via props,
 * ensuring the component can be used as an independent widget if wrapped.
 */
interface LoadingProps {
  /**
   * The size of the spinner.
   * 'sm': small, suitable for buttons or compact areas.
   * 'md': medium, default size for general use.
   * 'lg': large, for prominent loading states.
   * @default 'md' (or 'sm' if variant is 'button')
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * The color of the spinner. Must use Tailwind color tokens from the theme.
   * 'primary': uses the primary theme color (e.g., border-primary-500).
   * 'gray': uses a neutral gray color (e.g., border-gray-300).
   * 'white': uses white color (e.g., border-white).
   * 'current': uses the inherited text color (e.g., border-current), useful for button contexts.
   * @default 'primary' (or 'current' if variant is 'button')
   */
  color?: 'primary' | 'gray' | 'white' | 'current';
  /**
   * Additional Tailwind CSS classes to apply to the outermost container.
   */
  className?: string;
  /**
   * Optional text message to display below the spinner.
   * This text is only displayed if `variant` is 'default'.
   */
  text?: string;
  /**
   * The variant of the loading component.
   * 'default': A standard loading spinner that can display an accompanying text message.
   * 'button': A compact spinner designed for integration within buttons or small spaces.
   *           It automatically defaults to 'sm' size and 'current' color, and ignores the `text` prop.
   * @default 'default'
   */
  variant?: 'default' | 'button';
  /**
   * Tailwind CSS class for the text color of the optional loading message.
   * E.g., 'text-gray-600', 'text-primary-500'. This ensures text colors are theme-consistent.
   * @default 'text-gray-600'
   */
  textColorClassName?: string;
}

// Map spinner sizes to standard Tailwind CSS utility classes.
const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

// Map spinner colors to standard Tailwind CSS utility classes,
// aligning with Dashtail UI theme specifications (e.g., using 'primary' and generic 'gray').
const colorClasses = {
  primary: 'border-primary-500 border-t-transparent', // Uses Dashtail's primary theme color
  gray: 'border-gray-300 border-t-transparent',      // Uses a generic gray for neutral states
  white: 'border-white border-t-transparent',
  current: 'border-current border-t-transparent',
};

/**
 * A versatile Loading spinner component with configurable size, color, text, and variants.
 * It integrates the functionality of a button-specific loading spinner into a single component.
 */
export default function Loading({
  size,
  color,
  className,
  text,
  variant = 'default',
  textColorClassName = 'text-gray-600', // Default text color using a theme-consistent Tailwind token
}: LoadingProps) {
  // Determine the effective size based on the variant, with user override.
  const effectiveSize = variant === 'button' ? (size || 'sm') : (size || 'md');
  // Determine the effective color based on the variant, with user override.
  const effectiveColor = variant === 'button' ? (color || 'current') : (color || 'primary');
  // Only show text if the variant is 'default' and text is provided.
  const showText = variant === 'default' && text;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        // Adjust spacing based on variant; 'gap-3' for default, 'gap-0' for compact button variant.
        variant === 'default' ? 'gap-3' : 'gap-0',
        className
      )}
    >
      <div
        className={cn(
          'rounded-full animate-spin',
          sizeClasses[effectiveSize],
          colorClasses[effectiveColor]
        )}
        role="status" // Added for accessibility: indicates a live region whose content is informative.
        aria-label="Loading" // Added for accessibility: provides a descriptive label for screen readers.
      />
      {showText && (
        <p className={cn('text-sm text-center', textColorClassName)}>
          {text}
        </p>
      )}
    </div>
  );
}