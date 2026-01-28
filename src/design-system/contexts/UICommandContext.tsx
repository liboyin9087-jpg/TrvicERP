interface UICommandContextConfig<C = any, M = any> extends React.PropsWithChildren {
  /**
   * Optional callback for centralized error handling.
   * If provided, this will be called when a command execution fails.
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
 * @template C The type of state objects stored for components.
 * @template M The type of props objects passed to modals.
 */
interface UICommandContextValue<C = any, M = any> {
  executeCommand: (commandId: string, params?: UICommandParams) => Promise<UICommandResult>;
  registry: UICommandRegistry;
  componentStates: ReadonlyMap<string, C>;
  updateComponentState: (componentId: string, state: C) => void;
  modalStack: ReadonlyArray<{ id: string; props?: M }>;
  showModal: (id: string, props?: M) => void;
  hideModal: () => void;
}

// Initialize context with generic types defaulting to 'any' for flexibility.
const UICommandContext = createContext<UICommandContextValue<any, any> | null>(null);

/**
 * UICommandProvider - Provides the UI command execution context.
 * Enables Copilot-style function calling for UI manipulation within the application.
 *
 * This provider manages internal UI states like componentStates and modalStack,
 * which are directly manipulated by UI commands. It offers a structured way
 * to execute commands and handle their results and errors.
 *
 * @template C The type of state objects stored for components.
 * @template M The type of props objects passed to modals.
 */
export const UICommandProvider = <C = any, M = any>(
  props: UICommandContextConfig<C, M>
): React.FC<UICommandContextConfig<C, M>> => {
  const { children, onError } = props;
  const navigate = useNavigate();

  const [componentStates, setComponentStates] = useState<Map<string, C>>(new Map());
  const [modalStack, setModalStack] = useState<Array<{ id: string; props?: M }>>([]);

  const componentStatesRef = useRef(componentStates);
  const modalStackRef = useRef(modalStack);

  useEffect(() => {
    componentStatesRef.current = componentStates;
  }, [componentStates]);

  useEffect(() => {
    modalStackRef.current = modalStack;
  }, [modalStack]);

  /**
   * Updates the state of a specific component identified by its ID.
   * Ensures immutability by creating a new Map instance on update.
   */
  const updateComponentState = useCallback((componentId: string, state: C) => {
    setComponentStates(prev => {
      const next = new Map(prev);
      next.set(componentId, state);
      return next;
    });
  }, []);

  /**
   * Adds a new modal to the top of the modal stack.
   */
  const showModal = useCallback((id: string, modalProps?: M) => {
    setModalStack(prev => [...prev, { id, props: modalProps }]);
  }, []);

  /**
   * Removes the top-most modal from the modal stack.
   */
  const hideModal = useCallback(() => {
    setModalStack(prev => prev.slice(0, -1));
  }, []);

  /**
   * Executes a registered UI command.
   * Injects runtime dependencies and handles errors centrally.
   */
  const executeCommand = useCallback(async (
    commandId: string,
    params?: UICommandParams
  ): Promise<UICommandResult> => {
    const enhancedParams = {
      ...params,
      __runtime: {
        navigate,
        getComponentStates: () => componentStatesRef.current,
        updateComponentState,
        getModalStack: () => modalStackRef.current,
        showModal,
        hideModal,
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

      if (onError) {
        onError(err, commandId, params);
      } else {
        console.error(`Command ${commandId} failed:`, err);
      }
      return result;
    }
  }, [navigate, updateComponentState, showModal, hideModal, onError]);

  // The context value, providing access to command execution and UI states/actions.
  const value: UICommandContextValue<C, M> = {
    executeCommand,
    registry: uiCommandRegistry,
    componentStates: componentStates,
    updateComponentState,
    modalStack: modalStack,
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
 * @template C The type of state objects stored for components.
 * @template M The type of props objects passed to modals.
 */
export const useUICommands = <C = any, M = any>() => {
  const context = useContext(UICommandContext) as UICommandContextValue<C, M> | null;
  if (!context) {
    throw new Error('useUICommands must be used within UICommandProvider');
  }
  return context;
};

/**
 * Hook for easy command execution.
 * Error handling is delegated to `executeCommand` and the `UICommandProvider`'s `onError` prop.
 */
export const useCommand = () => {
  const { executeCommand } = useUICommands();

  return useCallback(async (commandId: string, params?: UICommandParams) => {
    return await executeCommand(commandId, params);
  }, [executeCommand]);
};