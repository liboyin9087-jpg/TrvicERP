import { Transition, Variants } from 'framer-motion';

// ============================================
// Interfaces
// ============================================

/**
 * Defines the structure for animation timing functions, durations, scales, and displacements.
 */
interface AnimationTokens {
  easing: {
    standard: string; // Cubic-bezier string for standard easing
    bounce: string;
    entrance: string; // Easing for elements entering the screen
    exit: string;     // Easing for elements exiting the screen
    elastic: string;
  };
  duration: {
    instant: number; // milliseconds
    fast: number;
    normal: number;
    slow: number;
    slower: number;
    slowest: number;
  };
  scale: {
    none: number;
    xs: number; // For very subtle shrink/grow, e.g., 0.99
    sm: number; // For small shrink/grow, e.g., 0.98 for button hover
    md: number; // For medium shrink/grow, e.g., 0.95 for modal entrance/exit
    lg: number; // For larger shrink/grow, e.g., 0.90
  };
  displacement: {
    none: number; // 0px
    xs: number; // e.g., 4px
    sm: number; // e.g., 8px
    md: number; // e.g., 16px
    lg: number; // e.g., 20px - common for list items entrance
    xl: number; // e.g., 32px
  };
}

/**
 * Defines the structure for a single Framer Motion variant configuration.
 */
interface MotionVariantConfig {
  [key: string]: Variants; // Each key maps to Framer Motion Variants
}

// ============================================
// Helper Functions
// ============================================

/**
 * Converts a cubic-bezier string to the [number, number, number, number] array format
 * required by Framer Motion's 'ease' property.
 */
const cubicBezierToArray = (bezierString: string): [number, number, number, number] => {
  const parts = bezierString.match(/cubic-bezier\(([^)]*)\)/);
  if (parts && parts[1]) {
    return parts[1].split(',').map(Number) as [number, number, number, number];
  }
  // Fallback to a default if parsing fails or string is invalid
  console.warn(`Invalid cubic-bezier string "${bezierString}", falling back to standard ease.`);
  return [0.4, 0, 0.2, 1]; // Default to standard ease
};

/**
 * Generates a Tailwind CSS `duration-*` class string.
 */
const getTailwindDuration = (durationMs: number): string => `duration-[${durationMs}ms]`;

/**
 * Generates a Tailwind CSS `ease-*` class string using arbitrary value syntax for cubic-bezier.
 */
const getTailwindEasing = (easingBezier: string): string => `ease-[${easingBezier}]`;


// ============================================
// Animation Tokens (Type-safe and Standardized)
// ============================================

export const ANIMATION_TOKENS: AnimationTokens = {
  // Timing functions (cubic-bezier values)
  easing: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)", // Typical 'ease-in-out'
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    entrance: "cubic-bezier(0, 0, 0.2, 1)",   // For elements entering gracefully
    exit: "cubic-bezier(0.4, 0, 1, 1)",       // For elements exiting gracefully
    elastic: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  },

  // Duration scales (in milliseconds)
  duration: {
    instant: 0,
    fast: 150,  // Quick interactions
    normal: 250, // Standard transitions
    slow: 350,  // More deliberate transitions
    slower: 500,
    slowest: 750,
  },

  // Scale factors for transformations (e.g., for hover, press, modal effects)
  scale: {
    none: 1,
    xs: 0.99, // Very subtle visual feedback
    sm: 0.98, // Small interactive feedback
    md: 0.95, // Common for modal/overlay interactions
    lg: 0.90, // Significant visual change
  },

  // Displacement values (in pixels) for translations (e.g., for list item entrances)
  displacement: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20, // Often used for initial off-screen position for list items
    xl: 32,
  }
} as const; // Ensures immutability of tokens

// ============================================
// Framer Motion Variants (Standardized and Type-safe)
// ============================================

export const MOTION_VARIANTS: MotionVariantConfig = {
  // Modal/overlay entrance/exit animations
  modal: {
    hidden: { opacity: 0, scale: ANIMATION_TOKENS.scale.md },
    visible: { 
      opacity: 1, 
      scale: ANIMATION_TOKENS.scale.none,
      transition: {
        duration: ANIMATION_TOKENS.duration.normal / 1000, // Convert ms to seconds for Framer Motion
        ease: cubicBezierToArray(ANIMATION_TOKENS.easing.entrance),
      } as Transition, // Explicitly type as Framer Motion Transition
    },
    exit: { 
      opacity: 0, 
      scale: ANIMATION_TOKENS.scale.md,
      transition: {
        duration: ANIMATION_TOKENS.duration.fast / 1000,
        ease: cubicBezierToArray(ANIMATION_TOKENS.easing.exit),
      } as Transition,
    },
  },

  // Fade in/out animations
  fade: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: ANIMATION_TOKENS.duration.normal / 1000,
        ease: cubicBezierToArray(ANIMATION_TOKENS.easing.standard),
      } as Transition,
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: ANIMATION_TOKENS.duration.fast / 1000,
        ease: cubicBezierToArray(ANIMATION_TOKENS.easing.exit),
      } as Transition,
    },
  },

  // Container for staggered list item animations
  listContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: (ANIMATION_TOKENS.duration.fast / 1000) * 0.5, // 50% of fast duration for first child delay
        staggerChildren: (ANIMATION_TOKENS.duration.fast / 1000) * 0.25, // 25% of fast duration for stagger
      } as Transition,
    },
  },

  // Individual list item entrance animation
  listItem: {
    hidden: { y: ANIMATION_TOKENS.displacement.lg, opacity: 0 },
    visible: {
      y: ANIMATION_TOKENS.displacement.none,
      opacity: 1,
      transition: {
        duration: ANIMATION_TOKENS.duration.normal / 1000,
        ease: cubicBezierToArray(ANIMATION_TOKENS.easing.entrance),
      } as Transition,
    },
  },

  // Drag handle related animations (for draggable components)
  dragHandle: {
    initial: {
      scale: ANIMATION_TOKENS.scale.none,
      boxShadow: "0px 0px 0px rgba(0,0,0,0)",
      transition: { duration: ANIMATION_TOKENS.duration.fast / 1000 } as Transition,
    },
    hover: {
      scale: ANIMATION_TOKENS.scale.sm, // Slightly shrink on hover to indicate interactability
      boxShadow: "0px 4px 10px rgba(0,0,0,0.1)", // Subtle shadow on hover
      transition: { duration: ANIMATION_TOKENS.duration.fast / 1000 } as Transition,
    },
    dragging: {
      scale: ANIMATION_TOKENS.scale.sm, // Maintained scale, or slight change if desired
      rotate: "2deg", // Slight rotation for a "lifted" effect
      x: 0, // Reset any inherited x/y for clean drag start
      y: 0,
      boxShadow: "0px 8px 20px rgba(0,0,0,0.2)", // More prominent shadow when dragging
      zIndex: 100, // Bring dragged item to front
      transition: {
        type: "spring", // Use spring for a more natural dragging feel
        stiffness: 200,
        damping: 20,
        duration: ANIMATION_TOKENS.duration.fast / 1000, // Quick snap to dragging state
      } as Transition,
    },
    dropped: {
      scale: ANIMATION_TOKENS.scale.none,
      rotate: "0deg",
      boxShadow: "0px 0px 0px rgba(0,0,0,0)",
      zIndex: 1, // Reset z-index
      transition: {
        type: "spring", // Spring back to original position/scale
        stiffness: 300,
        damping: 30,
        duration: ANIMATION_TOKENS.duration.normal / 1000,
      } as Transition,
    },
  },
} as const;

// ============================================
// Transition Classes (Tailwind CSS)
// ============================================

export const TRANSITION_CLASSES = {
  // General transitions
  all: `transition-all ${getTailwindDuration(ANIMATION_TOKENS.duration.normal)} ${getTailwindEasing(ANIMATION_TOKENS.easing.standard)}`,
  colors: `transition-colors ${getTailwindDuration(ANIMATION_TOKENS.duration.fast)} ${getTailwindEasing(ANIMATION_TOKENS.easing.standard)}`,
  transform: `transition-transform ${getTailwindDuration(ANIMATION_TOKENS.duration.normal)} ${getTailwindEasing(ANIMATION_TOKENS.easing.standard)}`,
  opacity: `transition-opacity ${getTailwindDuration(ANIMATION_TOKENS.duration.fast)} ${getTailwindEasing(ANIMATION_TOKENS.easing.standard)}`,

  // Specific component/interaction transitions
  hover: `transition-all ${getTailwindDuration(ANIMATION_TOKENS.duration.fast)} ${getTailwindEasing(ANIMATION_TOKENS.easing.standard)}`,
  button: `transition-all ${getTailwindDuration(ANIMATION_TOKENS.duration.fast)} ${getTailwindEasing(ANIMATION_TOKENS.easing.standard)}`,
  modal: `transition-all ${getTailwindDuration(ANIMATION_TOKENS.duration.normal)} ${getTailwindEasing(ANIMATION_TOKENS.easing.entrance)}`, // Uses entrance easing
  page: `transition-all ${getTailwindDuration(ANIMATION_TOKENS.duration.slow)} ${getTailwindEasing(ANIMATION_TOKENS.easing.standard)}`,

  // Drag handle transitions for standard CSS usage (if not using Framer Motion)
  dragHandle: `transition-all ${getTailwindDuration(ANIMATION_TOKENS.duration.fast)} ${getTailwindEasing(ANIMATION_TOKENS.easing.standard)}`,
} as const; // Ensures immutability of transition classes

// ============================================
// Usage Helpers
// ============================================

/**
 * Retrieves a predefined Tailwind CSS transition class string.
 * @param type The key of the desired transition class.
 * @returns A string containing Tailwind CSS transition utility classes.
 */
export function getTransition(type: keyof typeof TRANSITION_CLASSES): string {
  return TRANSITION_CLASSES[type];
}

/**
 * Retrieves a predefined Framer Motion variant configuration.
 * @param type The key of the desired motion variant group.
 * @returns A Framer Motion Variants object.
 */
export function getMotionVariants(type: keyof typeof MOTION_VARIANTS): Variants {
  return MOTION_VARIANTS[type];
}

// ============================================
// Type Exports
// ============================================

export type AnimationDuration = keyof typeof ANIMATION_TOKENS.duration;
export type AnimationEasing = keyof typeof ANIMATION_TOKENS.easing;
export type AnimationScale = keyof typeof ANIMATION_TOKENS.scale;
export type AnimationDisplacement = keyof typeof ANIMATION_TOKENS.displacement;
export type MotionVariantType = keyof typeof MOTION_VARIANTS;
export type TransitionType = keyof typeof TRANSITION_CLASSES;