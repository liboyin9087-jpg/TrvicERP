import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UICommandRegistry,
  uiCommandRegistry,
  UICommandParams,
  UICommandResult
} from '../kintone/ui-commands';

/**
 * Configuration interface for the UICommandProvider.
 * This adheres to the Kintone independence rule for configurable properties.
 */
interface UICommandContextConfig extends React.PropsWithChildren {
  /**
   * Optional callback for centralized error handling.
   * If provided, this will be called when a command execution fails.
   * This addresses the designer issue where `console.error` alone might be insufficient.
   */
  onError?: (error: Error, commandId: string, params?: UICommandParams) => void;
  // Future potential configuration options could be added here,
  // e.g., initial states for componentStates or modalStack, if they were meant to be
  // initialized externally rather than managed internally by the provider.
}

/**
 * Interface defining the shape of the UICommandContext value.
 * - `componentStates` is now `ReadonlyMap` to prevent accidental direct mutation.
 * - `modalStack` is now exposed and `ReadonlyArray`.
 * - `showModal` and `hideModal` are added as public APIs for modal management.
 */
interface UICommandContextValue {
  executeCommand: (commandId: string, params?: UICommandParams) => Promise<UICommandResult>;
  registry: UICommandRegistry;
  componentStates: ReadonlyMap<string, any>; // [designer] Make componentStates immutable in context
  updateComponentState: (componentId: string, state: any) => void;
  modalStack: ReadonlyArray<{ id: string; props?: any }>; // [designer] Expose modalStack
  showModal: (id: string, props?: any) => void; // [architect] Provide explicit modal actions
  hideModal: () => void; // [architect] Provide explicit modal actions
}

const UICommandContext = createContext<UICommandContextValue | null>(null);

/**
 * UICommandProvider - Provides the UI command execution context.
 * Enables Copilot-style function calling for UI manipulation within the application.
 *
 * This provider manages internal UI states like componentStates and modalStack,
 * which are directly manipulated by UI commands. It offers a structured way
 * to execute commands and handle their results and errors.
 *
 * [architect] UICommandProvider's responsibilities are now more focused on providing
 * the command execution environment and the states that these commands operate on.
 * Modal and component state management are integral to "UI manipulation" commands.
 */
export const UICommandProvider: React.FC<UICommandContextConfig> = (props) => {
  const { children, onError } = props;
  const navigate = useNavigate();

  // [architect] componentStates and modalStack are internal operational states
  // managed by this context. Using useState for them here is appropriate for their role.
  const [componentStates, setComponentStates] = useState<Map<string, any>>(new Map());
  const [modalStack, setModalStack] = useState<Array<{ id: string; props?: any }>>([]);

  // [architect] Use Refs to store mutable latest state values.
  // This allows `executeCommand` to have a stable identity while still accessing the latest state.
  const componentStatesRef = useRef(componentStates);
  const modalStackRef = useRef(modalStack);

  // Update refs whenever the actual state changes.
  useEffect(() => {
    componentStatesRef.current = componentStates;
  }, [componentStates]);

  useEffect(() => {
    modalStackRef.current = modalStack;
  }, [modalStack]);

  /**
   * Updates the state of a specific component identified by its ID.
   * [designer] Ensures immutability by creating a new Map instance on update.
   */
  const updateComponentState = useCallback((componentId: string, state: any) => {
    setComponentStates(prev => {
      const next = new Map(prev); // Always create a new Map for immutable updates
      next.set(componentId, state);
      return next;
    });
  }, []); // Dependencies are empty as `setComponentStates` is stable

  /**
   * Adds a new modal to the top of the modal stack.
   * [architect] Encapsulated modal logic.
   */
  const showModal = useCallback((id: string, modalProps?: any) => {
    setModalStack(prev => [...prev, { id, props: modalProps }]);
  }, []); // Dependencies are empty as `setModalStack` is stable

  /**
   * Removes the top-most modal from the modal stack.
   * [architect] Encapsulated modal logic.
   */
  const hideModal = useCallback(() => {
    setModalStack(prev => prev.slice(0, -1));
  }, []); // Dependencies are empty as `setModalStack` is stable

  /**
   * Executes a registered UI command.
   * [architect] Refactored to have a stable identity by using `useRef` and `useCallback`
   * for its dependencies, reducing potential unnecessary re-renders.
   * [architect] Centralized error handling.
   */
  const executeCommand = useCallback(async (
    commandId: string,
    params?: UICommandParams
  ): Promise<UICommandResult> => {
    // Inject runtime dependencies into commands.
    // Commands access latest states via getter functions from refs,
    // and manipulate states via public API functions (`showModal`, `hideModal`, `updateComponentState`).
    const enhancedParams = {
      ...params,
      __runtime: {
        navigate, // stable
        getComponentStates: () => componentStatesRef.current, // Getter for latest state
        updateComponentState, // stable function
        getModalStack: () => modalStackRef.current, // Getter for latest state
        showModal, // stable function, part of public API
        hideModal, // stable function, part of public API
        // Removed direct setModalStack to encourage use of showModal/hideModal for better abstraction.
      },
    };

    try {
      const result = await uiCommandRegistry.executeCommand(commandId, enhancedParams);
      return result;
    } catch (error) {
      const err = error as Error;
      const result: UICommandResult = {
        success: false,
        error: err,
        message: `Failed to execute command: ${err.message}`,
      };

      // [designer] Centralized error handling using the `onError` prop.
      // If `onError` is provided, it handles the error. Otherwise, it falls back to `console.error`.
      if (onError) {
        onError(err, commandId, params);
      } else {
        console.error(`Command ${commandId} failed:`, err);
      }
      return result;
    }
  }, [navigate, updateComponentState, showModal, hideModal, onError]); // Stable dependencies for useCallback

  // The context value, providing access to command execution and UI states/actions.
  const value: UICommandContextValue = {
    executeCommand,
    registry: uiCommandRegistry,
    componentStates: componentStates, // Provided as ReadonlyMap per interface
    updateComponentState,
    modalStack: modalStack, // Provided as ReadonlyArray per interface
    showModal,
    hideModal,
  };

  return (
    <UICommandContext.Provider value={value}>
      {children}
    </UICommandContext.Provider>
  );
};

/**
 * Hook to access the UI command execution context.
 * Throws an error if used outside of `UICommandProvider`.
 */
export const useUICommands = () => {
  const context = useContext(UICommandContext);
  if (!context) {
    throw new Error('useUICommands must be used within UICommandProvider');
  }
  return context;
};

/**
 * Hook for easy command execution.
 * [architect] Error handling is now delegated to `executeCommand` and the `UICommandProvider`'s `onError` prop,
 * preventing duplication of error logic.
 */
export const useCommand = () => {
  const { executeCommand } = useUICommands();

  // This hook now simply calls executeCommand and returns its result,
  // without duplicating error handling logic.
  return useCallback(async (commandId: string, params?: UICommandParams) => {
    return await executeCommand(commandId, params);
  }, [executeCommand]); // `executeCommand` is now stable, so this `useCallback` is also stable.
};