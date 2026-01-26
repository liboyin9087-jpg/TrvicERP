import React from "react";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
};

export default function Spinner({ size = "md", className = "", ariaLabel = "載入中" }: SpinnerProps) {
  const dims = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-12 h-12" : "w-8 h-8";
  return (
    <div role="status" className={`flex items-center justify-center ${className}`} aria-label={ariaLabel}>
      <svg
        className={`${dims} animate-spin text-brand-600`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}
