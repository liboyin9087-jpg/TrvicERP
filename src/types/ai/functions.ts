/**
 * AI function and capability definitions
 */

export interface AIFunction {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  category: string;
  enabled: boolean;
}

export interface AICapability {
  name: string;
  description: string;
  features: string[];
  enabled: boolean;
}

export interface AIFunctionRegistry {
  functions: AIFunction[];
  capabilities: AICapability[];
}
