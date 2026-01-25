import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UICommandRegistry, 
  uiCommandRegistry,
  UICommandParams,
  UICommandResult 
} from '../kintone/ui-commands';

interface UICommandContextValue {
  executeCommand: (commandId: string, params?: UICommandParams) => Promise<UICommandResult>;
  registry: UICommandRegistry;
  componentStates: Map<string, any>;
  updateComponentState: (componentId: string, state: any) => void;
}

const UICommandContext = createContext<UICommandContextValue | null>(null);

/**
 * UICommandProvider - Provides the UI command execution context
 * Enables Copilot-style function calling for UI manipulation
 */
export const UICommandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [componentStates, setComponentStates] = useState<Map<string, any>>(new Map());
  const [modalStack, setModalStack] = useState<Array<{ id: string; props?: any }>>([]);

  const updateComponentState = useCallback((componentId: string, state: any) => {
    setComponentStates(prev => {
      const next = new Map(prev);
      next.set(componentId, state);
      return next;
    });
  }, []);

  const executeCommand = useCallback(async (
    commandId: string, 
    params?: UICommandParams
  ): Promise<UICommandResult> => {
    // Inject runtime dependencies into commands
    const enhancedParams = {
      ...params,
      __runtime: {
        navigate,
        componentStates,
        updateComponentState,
        modalStack,
        setModalStack,
      },
    };

    try {
      const result = await uiCommandRegistry.executeCommand(commandId, enhancedParams);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: `Failed to execute command: ${(error as Error).message}`,
      };
    }
  }, [navigate, componentStates, updateComponentState, modalStack]);

  const value: UICommandContextValue = {
    executeCommand,
    registry: uiCommandRegistry,
    componentStates,
    updateComponentState,
  };

  return (
    <UICommandContext.Provider value={value}>
      {children}
    </UICommandContext.Provider>
  );
};

/**
 * Hook to access UI command execution
 */
export const useUICommands = () => {
  const context = useContext(UICommandContext);
  if (!context) {
    throw new Error('useUICommands must be used within UICommandProvider');
  }
  return context;
};

/**
 * Hook for easy command execution
 */
export const useCommand = () => {
  const { executeCommand } = useUICommands();
  
  return useCallback(async (commandId: string, params?: UICommandParams) => {
    const result = await executeCommand(commandId, params);
    if (!result.success) {
      console.error(`Command ${commandId} failed:`, result.error);
    }
    return result;
  }, [executeCommand]);
};
