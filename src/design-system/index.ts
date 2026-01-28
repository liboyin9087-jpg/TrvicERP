/**
 * Design System Index
 * Exports core, platform-agnostic design system components, utilities, and types.
 * Platform-specific (e.g., Kintone) elements and application-level contexts should be
 * exported from their own dedicated entry points to maintain architectural clarity and reusability.
 */

// Core Design System Components
export { default as Button } from "./Button";
export { default as DataGrid } from "./DataGrid";
export type { Column, DataGridProps } from "./DataGrid"; // DataGridProps serves as the primary configuration interface for DataGrid.

// Icon System
export { ICON_MAP, getIcon, type IconName } from "./icons";

// Animation System - Providing high-level utility functions and their types.
// Raw tokens and internal implementation details are not exposed at this top level
// to simplify the public API, addressing the "動畫系統匯出方式過於複雜" issue.
export { getTransition, getMotionVariants } from "./animation";
export type { AnimationDuration, AnimationEasing, MotionVariantType, TransitionType } from "./animation";

// Theme System & Design Tokens:
// The original file contained only Kintone-specific theme exports, which have been removed
// to address "混合關注點" and "主題系統命名不一致" issues.
// For a core design system, generic (platform-agnostic) theme tokens
// (e.g., colors, spacing, typography) would be exported here if they
// are not managed solely via Tailwind's config and utility classes.
// As per the Dashtail UI spec, direct hardcoded colors are forbidden,
// suggesting Tailwind tokens are the primary source. Thus, no separate
// theme object exports are included here, aligning with a Tailwind-first approach.

// Platform-specific components (e.g., KintoneButton, KintoneInput) and
// application-level contexts (UICommandProvider, MobileProvider) have been
// removed from this core design system index. They should be managed and
// exported from dedicated platform-specific modules or application-level entry points.
// This addresses "混合關注點", "設計系統索引混合了核心元件和 Kintone 特定元件",
// and "部分元件依賴 Context 而非明確的 Props 傳遞" issues, promoting modularity
// and explicit prop-based configuration for components.