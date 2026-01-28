import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';

// Utility function for debouncing
// This helps to optimize performance by limiting how often a function is called,
// especially useful for frequently firing events like 'resize'.
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
  let timeout: ReturnType<typeof setTimeout> | null;
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(context, args), delay);
  } as T;
}

export interface MobileProviderConfig {
  /**
   * Screen width threshold for mobile devices (exclusive upper bound).
   * Devices with screenWidth < mobileBreakpoint are considered mobile.
   * Must be a positive number.
   * Default: 768
   */
  mobileBreakpoint?: number;
  /**
   * Screen width threshold for tablet devices (exclusive upper bound).
   * Devices with screenWidth >= mobileBreakpoint and < tabletBreakpoint are considered tablet.
   * Must be a positive number and greater than mobileBreakpoint.
   * Default: 1024
   */
  tabletBreakpoint?: number;
  /**
   * Debounce delay for resize events in milliseconds.
   * This helps prevent excessive re-renders during window resizing.
   * Default: 150
   */
  resizeDebounceDelay?: number;
}

// Default breakpoint values, ensuring consistency across the application.
const DEFAULT_BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

// Default debounce delay for resize events.
const DEFAULT_RESIZE_DEBOUNCE_DELAY = 150;

// Interface defining the shape of the context value.
interface MobileContextValue {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
  touchEnabled: boolean;
  isClient: boolean;
}

// Default context value for Server-Side Rendering (SSR) and initial client-side render.
// During SSR, we assume a desktop-like environment to prevent mobile-specific UI from breaking,
// as actual device dimensions are not available.
// 'isClient' is explicitly false to indicate an SSR state.
const defaultMobileContextValue: MobileContextValue = {
  isMobile: false,
  isTablet: false,
  isDesktop: true, // Sensible default for SSR: assume desktop or a non-mobile layout
  orientation: 'portrait', // Default orientation, can be anything for SSR
  screenWidth: 0, // Placeholder for SSR, actual value will be updated on client mount
  screenHeight: 0, // Placeholder for SSR
  touchEnabled: false, // Assume no touch capabilities for SSR
  isClient: false, // Explicitly false for SSR default
};

// Create the React Context with the default value.
const MobileContext = createContext<MobileContextValue>(defaultMobileContextValue);

/**
 * Validates the provided breakpoints to ensure they are consistent and valid.
 * This helps prevent logical errors in device type detection.
 * @param mobile - The mobile breakpoint value.
 * @param tablet - The tablet breakpoint value.
 * @throws {Error} If breakpoints are invalid.
 */
const validateBreakpoints = (mobile: number, tablet: number) => {
  if (typeof mobile !== 'number' || mobile <= 0) {
    throw new Error('Mobile breakpoint must be a positive number.');
  }
  if (typeof tablet !== 'number' || tablet <= 0) {
    throw new Error('Tablet breakpoint must be a positive number.');
  }
  if (mobile >= tablet) {
    throw new Error('Mobile breakpoint must be less than tablet breakpoint.');
  }
};

/**
 * MobileProvider - Detects device type and provides mobile-specific context throughout its children.
 * It ensures SSR safety by initializing with default values and updating on client mount.
 * Breakpoints and resize debounce delay are configurable via props, allowing for flexible usage.
 *
 * @param {React.PropsWithChildren<MobileProviderConfig>} props - Configuration for the provider.
 * @param {React.ReactNode} props.children - The children components that will consume the context.
 * @param {number} [props.mobileBreakpoint=768] - Screen width threshold for mobile devices.
 * @param {number} [props.tabletBreakpoint=1024] - Screen width threshold for tablet devices.
 * @param {number} [props.resizeDebounceDelay=150] - Debounce delay for window resize events.
 */
export const MobileProvider: React.FC<React.PropsWithChildren<MobileProviderConfig>> = ({
  children,
  mobileBreakpoint = DEFAULT_BREAKPOINTS.mobile,
  tabletBreakpoint = DEFAULT_BREAKPOINTS.tablet,
  resizeDebounceDelay = DEFAULT_RESIZE_DEBOUNCE_DELAY,
}) => {
  // Use a ref to store validated breakpoints. This prevents re-validation on every render
  // and ensures that once validated, these values are consistently used.
  const validatedBreakpointsRef = useRef({ mobile: DEFAULT_BREAKPOINTS.mobile, tablet: DEFAULT_BREAKPOINTS.tablet });

  // Validate breakpoints using useMemo. This ensures validation only runs when
  // the breakpoint props actually change, optimizing performance.
  useMemo(() => {
    try {
      validateBreakpoints(mobileBreakpoint, tabletBreakpoint);
      validatedBreakpointsRef.current = { mobile: mobileBreakpoint, tablet: tabletBreakpoint };
    } catch (e: any) {
      // Log an error if validation fails and fall back to default breakpoints
      // to prevent the application from crashing due to misconfiguration.
      console.error(`Invalid MobileProvider breakpoints configuration: ${e.message}`);
      validatedBreakpointsRef.current = DEFAULT_BREAKPOINTS;
    }
  }, [mobileBreakpoint, tabletBreakpoint]);

  const actualMobileBreakpoint = validatedBreakpointsRef.current.mobile;
  const actualTabletBreakpoint = validatedBreakpointsRef.current.tablet;

  // Determine if the code is running in a client-side (browser) environment.
  // This is crucial for safely accessing `window` and `navigator` objects, which are
  // undefined during Server-Side Rendering (SSR).
  const isClient = typeof window !== 'undefined';

  // Initialize state variables. During SSR, these will be set to 0 or false,
  // and then updated with actual client-side values once the component mounts on the client.
  const [screenWidth, setScreenWidth] = useState(isClient ? window.innerWidth : 0);
  const [screenHeight, setScreenHeight] = useState(isClient ? window.innerHeight : 0);
  const [touchEnabled, setTouchEnabled] = useState(
    isClient ? ('ontouchstart' in window || (navigator.maxTouchPoints > 0)) : false
  );

  // useEffect hook to handle client-side specific logic:
  // - Setting up event listeners for window resize.
  // - Detecting touch capabilities.
  useEffect(() => {
    // Only execute this effect on the client-side to prevent SSR errors.
    if (!isClient) {
      return;
    }

    // Initialize touch detection once when the component mounts on the client.
    // This value is generally static for the device.
    setTouchEnabled('ontouchstart' in window || (navigator.maxTouchPoints > 0));

    // Create a debounced resize handler. This limits the frequency of state updates
    // when the window is resized, improving performance.
    const handleResize = debounce(() => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    }, resizeDebounceDelay);

    // Add the debounced resize event listener to the window.
    window.addEventListener('resize', handleResize);

    // Cleanup function: This runs when the component unmounts or if the dependencies change.
    // It's essential to remove event listeners to prevent memory leaks.
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isClient, resizeDebounceDelay]); // Dependencies: Re-run if client status or debounce delay changes.

  // useMemo to calculate and memoize the context value.
  // This prevents unnecessary re-renders of consuming components if the context value hasn't actually changed.
  const value = useMemo<MobileContextValue>(() => {
    // If running on the server, return the explicit SSR default context value.
    // This ensures consistency and prevents calculations based on placeholder `screenWidth: 0`
    // which would incorrectly categorize the device as mobile.
    if (!isClient) {
      return defaultMobileContextValue;
    }

    // Calculate device type based on current screen dimensions and validated breakpoints.
    const currentIsMobile = screenWidth < actualMobileBreakpoint;
    const currentIsTablet = screenWidth >= actualMobileBreakpoint && screenWidth < actualTabletBreakpoint;
    const currentIsDesktop = screenWidth >= actualTabletBreakpoint;
    const currentOrientation = screenWidth > screenHeight ? 'landscape' : 'portrait';

    return {
      isMobile: currentIsMobile,
      isTablet: currentIsTablet,
      isDesktop: currentIsDesktop,
      orientation: currentOrientation,
      screenWidth,
      screenHeight,
      touchEnabled,
      isClient,
    };
  }, [
    screenWidth,
    screenHeight,
    touchEnabled,
    actualMobileBreakpoint,
    actualTabletBreakpoint,
    isClient,
  ]);

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
};

/**
 * Hook to access the mobile context.
 * Provides device type, screen dimensions, orientation, and touch capabilities.
 * Throws an error if used outside of a MobileProvider on the client-side,
 * ensuring correct provider setup.
 *
 * @returns {MobileContextValue} The current mobile context value.
 * @throws {Error} If `useMobile` is called on the client without being wrapped by `MobileProvider`.
 */
export const useMobile = () => {
  const context = useContext(MobileContext);
  const isClientEnvironment = typeof window !== 'undefined'; // Check the actual environment where the hook is run

  // If the context value is still the default (meaning no MobileProvider is active)
  // AND we are running in a client-side environment, it indicates a misconfiguration.
  // In SSR, it's fine to return the default value without throwing an error.
  if (context === defaultMobileContextValue && isClientEnvironment) {
    throw new Error('useMobile must be used within MobileProvider on the client-side.');
  }
  return context;
};