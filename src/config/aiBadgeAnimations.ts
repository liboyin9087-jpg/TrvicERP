/**
 * AI Badge Animations Configuration
 * Defines Framer Motion animation variants and transitions
 */

export const badgeVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -10,
  },
};

export const badgeTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

export const detailVariants = {
  hidden: {
    opacity: 0,
    height: 0,
  },
  visible: {
    opacity: 1,
    height: 'auto',
  },
};

export const detailTransition = {
  type: 'tween' as const,
  duration: 0.3,
  ease: 'easeInOut' as const,
};

export const processingIconRotateTransition = {
  type: 'tween' as const,
  duration: 2,
  ease: 'linear' as const,
  repeat: Infinity,
};

export const processingPulseVariants = {
  pulse: {
    scale: [1, 1.1, 1],
  },
};

export const processingPulseTransition = {
  type: 'tween' as const,
  duration: 1.5,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

export const expandableIndicatorTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 40,
};

export const actionButtonVariants = {
  hover: {
    scale: 1.05,
  },
  tap: {
    scale: 0.95,
  },
};

export const actionButtonTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 40,
};
