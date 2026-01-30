import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './src/lib/i18n'; // Initialize i18next before rendering
import { warnIfEnvMisconfigured } from '@/lib/env';

warnIfEnvMisconfigured();

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<React.StrictMode><App /></React.StrictMode>);
}
