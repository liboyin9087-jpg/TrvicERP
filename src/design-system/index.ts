/**
 * Design System Index
 * Exports all design system components, utilities, and tokens
 */

// Core Design System Components
export { default as Button } from "./Button";
export { default as DataGrid } from "./DataGrid";
export type { Column, DataGridProps } from "./DataGrid";

// Design Tokens & Theme System
export {
  kintoneColors,
  kintoneSpacing,
  kintoneBorderRadius,
  kintoneShadows,
  kintoneTypography,
  kintoneBreakpoints,
  kintoneZIndex,
  kintoneMobileTheme,
} from "./kintone/theme";
export type { KintoneTheme as KintoneThemeType } from "./kintone/theme";

// Icon System
export { ICON_MAP, getIcon, type IconName } from "./icons";

// Animation System
export {
  ANIMATION_TOKENS,
  MOTION_VARIANTS,
  TRANSITION_CLASSES,
  getTransition,
  getMotionVariants,
  type AnimationDuration,
  type AnimationEasing,
  type MotionVariantType,
  type TransitionType,
} from "./animation";

// Legacy exports for backward compatibility
export * from "./kintone/types";
export * from "./kintone/ui-commands";

// Kintone-style Components
export { KintoneButton } from "./components/KintoneButton";
export { KintoneInput } from "./components/KintoneInput";
export { KintoneModal } from "./components/KintoneModal";

// Contexts
export {
  UICommandProvider,
  useUICommands,
  useCommand,
} from "./contexts/UICommandContext";
export { MobileProvider, useMobile } from "./contexts/MobileContext";
