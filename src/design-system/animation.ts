/**
 * Animation System - Unified motion strategy for TrvicERP
 */

// ============================================
// Animation Tokens
// ============================================

export const ANIMATION_TOKENS = {
  // Timing functions (cubic-bezier values)
  easing: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    entrance: "cubic-bezier(0, 0, 0.2, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
    elastic: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  },

  // Duration scales (in milliseconds)
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
    slowest: 750,
  },
} as const;

// ============================================
// Framer Motion Variants
// ============================================

export const MOTION_VARIANTS = {
  // Modal/overlay entrance
  modal: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.25,
        ease: [0, 0, 0.2, 1] as [number, number, number, number],
      },
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: [0.4, 0, 1, 1] as [number, number, number, number],
      },
    },
  },

  // Fade in/out
  fade: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      },
    },
    exit: { 
      opacity: 0,
      transition: {
        duration: 0.15,
        ease: [0.4, 0, 1, 1] as [number, number, number, number],
      },
    },
  },

  // List item stagger
  listContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.05,
      },
    },
  },

  listItem: {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      },
    },
  },
} as const;

// ============================================
// Transition Classes
// ============================================

export const TRANSITION_CLASSES = {
  all: "transition-all duration-250 ease-out",
  colors: "transition-colors duration-200 ease-out",
  transform: "transition-transform duration-250 ease-out",
  opacity: "transition-opacity duration-200 ease-out",
  hover: "transition-all duration-150 ease-out",
  button: "transition-all duration-200 ease-out",
  modal: "transition-all duration-250 ease-out",
  page: "transition-all duration-300 ease-out",
} as const;

// ============================================
// Usage Helpers
// ============================================

export function getTransition(type: keyof typeof TRANSITION_CLASSES): string {
  return TRANSITION_CLASSES[type];
}

export function getMotionVariants(type: keyof typeof MOTION_VARIANTS) {
  return MOTION_VARIANTS[type];
}

// ============================================
// Type Exports
// ============================================

export type AnimationDuration = keyof typeof ANIMATION_TOKENS.duration;
export type AnimationEasing = keyof typeof ANIMATION_TOKENS.easing;
export type MotionVariantType = keyof typeof MOTION_VARIANTS;
export type TransitionType = keyof typeof TRANSITION_CLASSES;