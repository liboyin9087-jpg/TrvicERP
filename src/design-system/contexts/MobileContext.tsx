import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export interface MobileProviderConfig {
  /**
   * Screen width threshold for mobile devices (exclusive upper bound).
   * Devices with screenWidth < mobileBreakpoint are considered mobile.
   * Default: 768
   */
  mobileBreakpoint?: number;
  /**
   * Screen width threshold for tablet devices (exclusive upper bound).
   * Devices with screenWidth >= mobileBreakpoint and < tabletBreakpoint are considered tablet.
   * Default: 1024
   */
  tabletBreakpoint?: number;
}

const DEFAULT_BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
};

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

const defaultMobileContextValue: MobileContextValue = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  orientation: 'portrait',
  screenWidth: 0,
  screenHeight: 0,
  touchEnabled: false,
  isClient: typeof window !== 'undefined',
};

const MobileContext = createContext<MobileContextValue>(defaultMobileContextValue);

/**
 * MobileProvider - Detects device type and provides mobile-specific context.
 * It addresses SSR issues by initializing with defaults and updating on client mount.
 * Breakpoints are now configurable via props.
 */
export const MobileProvider: React.FC<React.PropsWithChildren<MobileProviderConfig>> = ({
  children,
  mobileBreakpoint = DEFAULT_BREAKPOINTS.mobile,
  tabletBreakpoint = DEFAULT_BREAKPOINTS.tablet,
}) => {
  const isClient = typeof window !== 'undefined';

  const [screenWidth, setScreenWidth] = useState(isClient ? window.innerWidth : 0);
  const [screenHeight, setScreenHeight] = useState(isClient ? window.innerHeight : 0);
  const [touchEnabled, setTouchEnabled] = useState(
    isClient ? ('ontouchstart' in window || navigator.maxTouchPoints > 0) : false
  );

  useEffect(() => {
    if (!isClient) {
      return;
    }

    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    setTouchEnabled('ontouchstart' in window || navigator.maxTouchPoints > 0);

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isClient]);

  const value = useMemo<MobileContextValue>(() => {
    const currentIsMobile = screenWidth < mobileBreakpoint;
    const currentIsTablet = screenWidth >= mobileBreakpoint && screenWidth < tabletBreakpoint;
    const currentIsDesktop = screenWidth >= tabletBreakpoint;
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
  }, [screenWidth, screenHeight, touchEnabled, mobileBreakpoint, tabletBreakpoint, isClient]);

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
};

/**
 * Hook to access mobile context.
 * Provides device type, screen dimensions, orientation, and touch capabilities.
 */
export const useMobile = () => {
  const context = useContext(MobileContext);

  if (context === defaultMobileContextValue && context.isClient) {
    throw new Error('useMobile must be used within MobileProvider');
  }
  return context;
};