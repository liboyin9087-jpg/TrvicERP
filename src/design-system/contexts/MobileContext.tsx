import React, { createContext, useContext, useState, useEffect } from 'react';

interface MobileContextValue {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
  touchEnabled: boolean;
}

const MobileContext = createContext<MobileContextValue | null>(null);

/**
 * MobileProvider - Detects device type and provides mobile-specific context
 */
export const MobileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);
  const [touchEnabled] = useState('ontouchstart' in window || navigator.maxTouchPoints > 0);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;
  const orientation = screenWidth > screenHeight ? 'landscape' : 'portrait';

  const value: MobileContextValue = {
    isMobile,
    isTablet,
    isDesktop,
    orientation,
    screenWidth,
    screenHeight,
    touchEnabled,
  };

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
};

/**
 * Hook to access mobile context
 */
export const useMobile = () => {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobile must be used within MobileProvider');
  }
  return context;
};
