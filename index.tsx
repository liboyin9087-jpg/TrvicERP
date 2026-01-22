import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { warnIfEnvMisconfigured } from '@/lib/env';

warnIfEnvMisconfigured();

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<React.StrictMode><App /></React.StrictMode>);
}
