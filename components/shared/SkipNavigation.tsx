import React from 'react';

/**
 * SkipNavigation provides an accessible "skip to content" link
 * that is only visible when focused via keyboard navigation.
 */
export default function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
    >
      跳至主要內容
    </a>
  );
}
