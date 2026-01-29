import React from 'react';

const LOCALHOST_PATTERN = /(localhost|127\.0\.0\.1|0\.0\.0\.0)/i;

/**
 * Defines the structure for required URL configurations used in checks.
 */
interface RequiredUrlConfig {
  key: keyof Omit<EnvConfigWidgetConfig, 'isProd' | 'useMock'>; // Keys must match EnvConfigWidgetConfig props
  label: string;
}

const REQUIRED_URLS: RequiredUrlConfig[] = [
  { key: 'VITE_API_URL', label: 'Backend API URL' },
  { key: 'VITE_AI_API_URL', label: 'AI API URL' },
  { key: 'VITE_WS_URL', label: 'WebSocket URL' },
  { key: 'VITE_LINE_API_URL', label: 'LINE API URL' },
];

/**
 * Props interface for the EnvConfigWidget component.
 * This defines the environment variables and flags that the widget will receive
 * to perform its configuration checks.
 */
export interface EnvConfigWidgetConfig {
  isProd: boolean; // Corresponds to import.meta.env.PROD
  useMock: boolean; // Corresponds to import.meta.env.VITE_USE_MOCK === 'true' (or other boolean logic)
  VITE_API_URL?: string;
  VITE_AI_API_URL?: string;
  VITE_WS_URL?: string;
  VITE_LINE_API_URL?: string;
  // Add any other environment variables here that need to be checked by this widget.
}

/**
 * A React widget that checks and displays warnings for environment configuration
 * issues, primarily intended for production deployments.
 * It adheres to Dashtail UI guidelines and supports Kintone independence by
 * receiving all necessary data via props.
 */
const EnvConfigWidget: React.FC<EnvConfigWidgetConfig> = (props) => {
  const { isProd, useMock, ...envUrlProps } = props;

  // The original logic only performs checks in production mode.
  if (!isProd) {
    return null; // Do not display the widget if not in production
  }

  // If mock mode is enabled, display an informational message and skip URL checks.
  if (useMock) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden my-4">
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 rounded-t-lg flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Environment Configuration</h3>
          <div className="drag-handle w-6 h-6 bg-transparent cursor-move" aria-label="Drag handle"></div>
        </div>
        <div className="p-4 text-gray-700">
          <p className="text-sm">
            <span className="font-medium text-primary-700">[env]</span> Mock mode enabled; backend requests are disabled.
          </p>
        </div>
      </div>
    );
  }

  const issues: string[] = [];

  for (const { key, label } of REQUIRED_URLS) {
    // Access environment variable values from props dynamically
    const value = (envUrlProps as Record<string, string | undefined>)[key];

    if (!value) {
      issues.push(`${key} is missing (${label}).`);
      continue;
    }
    if (LOCALHOST_PATTERN.test(value)) {
      issues.push(`${key} points to localhost (${value}).`);
    }
  }

  // If there are no issues and not in mock mode, the widget does not need to be displayed.
  if (issues.length === 0) {
    return null;
  }

  // Display issues within a Dashtail-compliant card structure.
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden my-4">
      <div className="bg-primary-100 px-4 py-2 border-b border-primary-200 rounded-t-lg flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary-800">Environment Configuration Warnings</h3>
        <div className="drag-handle w-6 h-6 bg-transparent cursor-move" aria-label="Drag handle"></div>
      </div>
      <div className="p-4 bg-primary-50 text-primary-900">
        <p className="font-medium text-primary-800 mb-2">
          [env] Possible deployment configuration issues found:
        </p>
        <ul className="list-disc list-inside text-sm">
          {issues.map((issue, index) => (
            <li key={index} className="text-red-600">
              {issue}
            </li>
          ))}
        </ul>
        <p className="text-xs mt-2 text-primary-700">
          Please review your deployment environment variables (e.g., on Vercel or similar platforms).
        </p>
      </div>
    </div>
  );
};

export default EnvConfigWidget;

export const warnIfEnvMisconfigured = (config: EnvConfigWidgetConfig): boolean => {
  const { isProd, useMock, ...envUrlProps } = config;

  if (!isProd || useMock) {
    return false;
  }

  for (const { key } of REQUIRED_URLS) {
    const value = (envUrlProps as Record<string, string | undefined>)[key];
    if (!value) {
      console.warn(`Environment variable ${key} is missing`);
      return true;
    }
  }

  return false;
};