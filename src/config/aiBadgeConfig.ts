/**
 * AI Badge Configuration
 * Exports icons and default configurations for AI Badge components
 */

import {
  Sparkles,
  Zap,
  Brain,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Lightbulb,
} from 'lucide-react';

// Export all icons used in AIBadge
export {
  Sparkles,
  Zap,
  Brain,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Lightbulb,
};

export type AIBadgeType = 'suggestion' | 'analysis' | 'warning' | 'success' | 'processing';
export type AIBadgeSize = 'sm' | 'md' | 'lg';

export const defaultAIBadgeComponentConfig = {
  suggestion: {
    icon: Sparkles,
    color: 'bg-blue-100',
    textColor: 'text-blue-900',
    borderColor: 'border-blue-300',
  },
  analysis: {
    icon: Brain,
    color: 'bg-purple-100',
    textColor: 'text-purple-900',
    borderColor: 'border-purple-300',
  },
  warning: {
    icon: AlertCircle,
    color: 'bg-yellow-100',
    textColor: 'text-yellow-900',
    borderColor: 'border-yellow-300',
  },
  success: {
    icon: CheckCircle,
    color: 'bg-green-100',
    textColor: 'text-green-900',
    borderColor: 'border-green-300',
  },
  processing: {
    icon: Zap,
    color: 'bg-indigo-100',
    textColor: 'text-indigo-900',
    borderColor: 'border-indigo-300',
  },
};

// Alias for backward compatibility
export const AIBadgeComponentConfig = defaultAIBadgeComponentConfig;

export interface AIContext {
  mode: AIBadgeType;
  userId: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
