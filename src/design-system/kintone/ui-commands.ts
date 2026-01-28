/**
 * UI Command System - Copilot-style function calling interface
 * Enables programmatic UI control and screen manipulation
 *
 * This file defines the core interfaces, commands, and a registry
 * for a robust, type-safe, and dependency-injectable UI command system.
 * It is designed to be independent of specific UI frameworks or platforms
 * like Kintone, by abstracting external interactions through the ICommandContext.
 */

// --- 1. Core Type Definitions and Interfaces ---

/**
 * Defines the categories for UI commands.
 * This can be extended by adding new literal types to the union.
 */
export type CommandCategory =
  | 'navigation'
  | 'ui'
  | 'data'
  | 'modal'
  | 'notification'
  | 'state'
  | 'system'
  | 'form';

/**
 * A discriminated union type for command execution results.
 * It strictly separates success and failure outcomes.
 * @template TData The type of data returned on success. Defaults to unknown.
 * @template TError The type of error returned on failure. Defaults to Error.
 */
export type CommandResult<TData = unknown, TError extends Error = Error> =
  | { success: true; data: TData; message?: string }
  | { success: false; error: TError; message?: string };

/**
 * Interface for the context object that provides all necessary external dependencies
 * to commands. This enables Dependency Injection.
 */
export interface ICommandContext {
  router: IRouterService;
  ui: IUIService;
  modal: IModalService;
  notification: INotificationService;
  data: IDataService;
  state: IStateService;
  logger?: ILoggerService; // Optional logger service
}

/**
 * Generic interface for a UI Command.
 * It supports specific parameter types, return data types, and an optional undo function.
 * @template TParams The type of parameters the command accepts. Defaults to a generic object.
 * @template TData The type of data the command returns on successful execution. Defaults to unknown.
 * @template TError The type of error the command returns on failure. Defaults to Error.
 */
export interface IUICommand<
  TParams extends Record<string, unknown> = Record<string, unknown>,
  TData = unknown,
  TError extends Error = Error
> {
  id: string;
  name: string;
  description: string;
  category: CommandCategory;
  isUndoable: boolean; // Indicates if this command supports an undo operation.
  execute: (params: TParams, context: ICommandContext) => Promise<CommandResult<TData, TError>>;
  undo?: (params: TParams, context: ICommandContext) => Promise<CommandResult<void, TError>>;
}

// --- 2. Service Interfaces for Dependency Injection ---

/**
 * Interface for navigation-related services.
 * Concrete implementations will interact with the actual routing mechanism (e.g., React Router, Kintone routing).
 */
export interface IRouterService {
  navigate(path: string, options?: { replace?: boolean }): Promise<void>;
  goBack(): Promise<void>;
}

/**
 * Interface for general UI manipulation services.
 * Concrete implementations will interact with the UI rendering layer (e.g., React components, DOM).
 */
export interface IUIService {
  showComponent(componentId: string): Promise<void>;
  hideComponent(componentId: string): Promise<void>;
  updateComponentProps(componentId: string, props: Record<string, unknown>): Promise<void>;
}

/**
 * Interface for modal dialog services.
 * Concrete implementations will manage modal component lifecycles.
 */
export interface IModalService {
  openModal<TProps extends Record<string, unknown>>(modalId: string, props?: TProps): Promise<void>;
  closeModal(): Promise<void>;
}

/**
 * Interface for notification services (toasts, alerts).
 * Concrete implementations will display notifications.
 */
export interface INotificationService {
  showToast(message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number): Promise<void>;
  showAlert(title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info'): Promise<void>;
}

/**
 * Interface for data fetching and manipulation services.
 * Concrete implementations will interact with APIs, databases, or local stores.
 */
export interface IDataService {
  fetchData<TResult = unknown>(endpoint: string, method?: string, body?: unknown, headers?: Record<string, string>): Promise<TResult>;
  updateData<TData = unknown>(storeKey: string, data: TData): Promise<void>;
}

/**
 * Interface for state management services.
 * Concrete implementations will interact with global state (e.g., Redux, Zustand, React Context, Kintone fields).
 */
export interface IStateService {
  setState<TValue = unknown>(key: string, value: TValue): Promise<void>;
  getState<TValue = unknown>(key: string): Promise<TValue | undefined>;
}

/**
 * Optional interface for logging.
 */
export interface ILoggerService {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: Error, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}


// --- 3. Specific Command Definitions ---

// Define specific parameter interfaces for each command for strict type checking
interface NavigateParams { path: string; replace?: boolean; }
interface GoBackParams {}

interface ShowComponentParams { componentId: string; }
interface HideComponentParams { componentId: string; }
interface UpdateComponentPropsParams { componentId: string; props: Record<string, unknown>; }

interface OpenModalParams<TProps extends Record<string, unknown> = Record<string, unknown>> { modalId: string; props?: TProps; }
interface CloseModalParams {}

interface ShowToastParams { message: string; type?: 'success' | 'error' | 'warning' | 'info'; duration?: number; }
interface ShowAlertParams { title: string; message: string; type?: 'success' | 'error' | 'warning' | 'info'; }

interface FetchDataParams { endpoint: string; method?: string; body?: unknown; headers?: Record<string, string>; }
interface UpdateDataParams { storeKey: string; data: unknown; }

interface SetStateParams { key: string; value: unknown; }
interface GetStateParams { key: string; }


/**
 * Navigation Commands
 */
export const navigationCommands: IUICommand<NavigateParams | GoBackParams, void>[] = [
  {
    id: 'navigate',
    name: 'Navigate',
    description: 'Navigate to a specific route',
    category: 'navigation',
    isUndoable: false, // Navigation is generally not easily undoable without complex history management.
    execute: async (params: NavigateParams, context: ICommandContext): Promise<CommandResult<void>> => {
      try {
        await context.router.navigate(params.path, { replace: params.replace });
        context.logger?.info(`Navigated to ${params.path}`);
        return { success: true, data: undefined, message: `Navigating to ${params.path}` };
      } catch (error) {
        context.logger?.error(`Failed to navigate to ${params.path}`, error as Error);
        return { success: false, error: error as Error, message: `Failed to navigate to ${params.path}: ${(error as Error).message}` };
      }
    },
  },
  {
    id: 'goBack',
    name: 'Go Back',
    description: 'Navigate to previous page',
    category: 'navigation',
    isUndoable: false,
    execute: async (_params: GoBackParams, context: ICommandContext): Promise<CommandResult<void>> => {
      try {
        await context.router.goBack();
        context.logger?.info('Navigated back');
        return { success: true, data: undefined, message: 'Navigating back' };
      } catch (error) {
        context.logger?.error('Failed to go back', error as Error);
        return { success: false, error: error as Error, message: `Failed to go back: ${(error as Error).message}` };
      }
    },
  },
];

/**
 * UI Manipulation Commands
 */
export const uiCommands: IUICommand<ShowComponentParams | HideComponentParams | UpdateComponentPropsParams, void>[] = [
  {
    id: 'showComponent',
    name: 'Show Component',
    description: 'Show a specific component',
    category: 'ui',
    isUndoable: true, // Can be undone by 'hideComponent'
    execute: async (params: ShowComponentParams, context: ICommandContext): Promise<CommandResult<void>> => {
      try {
        await context.ui.showComponent(params.componentId);
        context.logger?.info(`Showing component ${params.componentId}`);
        return { success: true, data: undefined, message: `Showing component ${params.componentId}` };
      } catch (error) {
        context.logger?.error(`Failed to show component ${params.componentId}`, error as Error);
        return { success: false, error: error as Error, message: `Failed to show component ${params.componentId}: ${(error as Error).message}` };
      }
    },
    undo: async (params: ShowComponentParams, context: ICommandContext): Promise<CommandResult<void>> => {
      try {
        await context.ui.hideComponent(params.componentId); // Undo: hide the component
        context.logger?.info(`Undoing: hiding component ${params.componentId}`);
        return { success: true, data: undefined, message: `Undoing: hiding component ${params.componentId}` };
      } catch (error) {
        context.logger?.error(`Failed to undo show component ${params.componentId}`, error as Error);
        return { success: false, error: error as Error, message: `Failed to undo show component ${params.componentId}: ${(error as Error).message}` };
      }
    },
  },
  {
    id: 'hideComponent',
    name: 'Hide Component',
    description: 'Hide a specific component',
    category: 'ui',
    isUndoable: true, // Can be undone by 'showComponent'
    execute: async (params: HideComponentParams, context: ICommandContext): Promise<CommandResult<void>> => {
      try {
        await context.ui.hideComponent(params.componentId);
        context.logger?.info(`Hiding component ${params.componentId}`);
        return { success: true, data: undefined, message: `Hiding component ${params.componentId}` };
      } catch (error) {
        context.logger?.error(`Failed to hide component ${params.componentId}`, error as Error);
        return { success: false, error: error as Error, message: `Failed to hide component ${params.componentId}: ${(error as Error).message}` };
      }
    },
    undo: async (params: HideComponentParams, context: ICommandContext): Promise<CommandResult<void>> => {
      try {
        await context.ui.showComponent(params.componentId); // Undo: show the component
        context.logger?.info(`Undoing: showing component ${params.componentId}`);
        return { success: true, data: undefined, message: `Undoing: showing component ${params.componentId}` };
      } catch (error) {
        context.logger?.error(`Failed to undo hide component ${params.componentId}`, error as Error);
        return { success: false, error: error as Error, message: `Failed to undo hide component ${params.componentId}: ${(error as Error).message}` };
      }
    },
  },
  {
    id: 'updateComponentProps',
    name: 'Update Component Props',
    description: 'Update props of a component',
    category: 'ui',
    isUndoable: false, // Undo would require storing previous props, which is complex and application-specific.
    execute: async (params: UpdateComponentPropsParams, context: ICommandContext): Promise<CommandResult<void>> => {
      try {
        await context.ui.updateComponentProps(params.componentId, params.props);
        context.logger?.info(`Updated component ${params.componentId} props`);
        return { success: true, data: undefined, message: `Updated component ${params.componentId}` };
      } catch (error) {
        context.logger?.error(`Failed to update component ${params.componentId} props`, error as Error);
        return { success: false, error: error as Error, message: `Failed to update component ${params.componentId}: ${(error as Error).message}` };
      }
    },
  },
];

/**
 * Modal Commands
 */
export const modalCommands: IUICommand<OpenModalParams | CloseModalParams, void>[] = [
  {
    id: 'openModal',
    name: 'Open Modal',
    description: 'Open a modal dialog',
    category: 'modal',
    isUndoable: true, // Can be undone by 'closeModal'
    execute: async <TProps extends Record<string, unknown>>(params: OpenModalParams<TProps>, context: ICommandContext): Promise<CommandResult<void>> => {
      try {
        await context.modal.openModal(params.modalId, params.props);
        context.logger?.info(`Opening modal ${params.modalId}`);
        return { success: true, data: undefined, message: `Opening modal ${params.modalId}` };
      } catch (error) {
        context.logger?.error(`Failed to open modal ${params.modalId}`, error as Error);
        return { success: false, error: error as Error, message: `Failed to open modal ${params.modalId}: ${(error as Error).message}` };
      }
    },
    undo: async (_params: CloseModalParams, context: ICommandContext): Promise<CommandResult<void>> => {
      try {
        await context.modal.closeModal(); // Undo: close the modal
        context.logger?.info(`Undoing: closing modal`);
        return { success: true, data: undefined, message: `Undoing: closing modal` };
      } catch (error) {
        context.logger?.error(`Failed to undo open modal`, error as Error);
        return { success: false, error: error as Error, message: `Failed to undo open modal: ${(error as Error).message}` };
      }
    },
  },
  {
    id: 'closeModal',
    name: 'Close Modal',
    description: 'Close the current modal',
    category: 'modal',
    isUndoable: false, // Closing a modal can't always be trivially undone without knowing its original state/props.
    execute: async (_params: CloseModalParams, context: ICommandContext): Promise<CommandResult<void>> => {
      try {
        await context.modal.closeModal();
        context.logger?.info('Closing modal');
        return { success: true, data: undefined, message: 'Closing modal' };
      } catch (error) {
        context.logger?.error('Failed to close modal', error as Error);
        return { success: false, error: error as Error, message: `Failed to close modal: ${(error as Error).message}` };
      }
    },
  },
];

/**
 * Notification Commands
 */
export const notificationCommands: IUICommand<ShowToastParams | ShowAlertParams, void>[] = [
  {
    id: 'showToast',
    name: 'Show Toast',
    description: 'Show a toast notification',
    category: 'notification',
    isUndoable: false, // Notifications are typically transient and not meant to be undone.
    execute: async (params: ShowToastParams, context: ICommandContext): Promise<CommandResult<void>> => {
      try {
        await context.notification.showToast(params.message, params.type, params.duration);
        context.logger?.info('Toast shown');
        return { success: true, data: undefined, message: 'Toast shown' };
      } catch (error) {
        context.logger?.error('Failed to show toast', error as Error);
        return { success: false, error: error as Error, message: `Failed to show toast: ${(error as Error).message}` };
      }
    },
  },
  {
    id: 'showAlert',
    name: 'Show Alert',
    description: 'Show an alert dialog',
    category: 'notification',
    isUndoable: false, // Alerts are typically transient and not meant to be undone.
    execute: async (params: ShowAlertParams, context: ICommandContext): Promise<CommandResult<void>> => {
      try {
        await context.notification.showAlert(params.title, params.message, params.type);
        context.logger?.info('Alert shown');
        return { success: true, data: undefined, message: 'Alert shown' };
      } catch (error) {
        context.logger?.error('Failed to show alert', error as Error);
        return { success: false, error: error as Error, message: `Failed to show alert: ${(error as Error).message}` };
      }
    },
  },
];

/**
 * Data Commands
 */
export const dataCommands: IUICommand<FetchDataParams | UpdateDataParams, unknown>[] = [
  {
    id: 'fetchData',
    name: 'Fetch Data',
    description: 'Fetch data from an API',
    category: 'data',
    isUndoable: false, // Fetching data is a read operation, no state to undo.
    execute: async <TResult>(params: FetchDataParams, context: ICommandContext): Promise<CommandResult<TResult>> => {
      try {
        const data = await context.data.fetchData<TResult>(params.endpoint, params.method, params.body, params.headers);
        context.logger?.info(`Data fetched from ${params.endpoint}`);
        return { success: true, data, message: 'Data fetched' };
      } catch (error) {
        context.logger?.error(`Failed to fetch data from ${params.endpoint}`, error as Error);
        return { success: false, error: error as Error, message: `Failed to fetch data from ${params.endpoint}: ${(error as Error).message}` };
      }
    },
  },
  {
    id: 'updateData',
    name: 'Update Data',
    description: 'Update data in the store',
    category: 'data',
    isUndoable: true, // Potentially undoable if previous state is captured. (Highly dependent on implementation)
    execute: async (params: UpdateDataParams, context: ICommandContext): Promise<CommandResult<void>> => {
      // For undoable, you'd typically fetch the current state BEFORE updating,
      // and store it in a history stack with the command parameters.
      // For simplicity in this example, we assume undo logic might be more complex
      // or handled by a higher-level CommandManager.
      try {
        await context.data.updateData(params.storeKey, params.data);
        context.logger?.info(`Data updated for key ${params.storeKey}`);
        return { success: true, data: undefined, message: 'Data updated' };
      } catch (error) {
        context.logger?.error(`Failed to update data for key ${params.storeKey}`, error as Error);
        return { success: false, error: error as Error, message: `Failed to update data for key ${params.storeKey}: ${(error as Error).message}` };
      }
    },
    undo: async (params: UpdateDataParams, context: ICommandContext): Promise<CommandResult<void>> => {
      // REAL UNDO: requires the previous state. This is a placeholder.
      // A more robust system would store the *previous value* of `params.storeKey`
      // when `updateData` was executed, and `undo` would use that previous value.
      const errorMessage = "Undo for 'updateData' is not fully implemented: Requires previous state capture.";
      context.logger?.warn(`Undo for updateData on key ${params.storeKey} is a placeholder and requires state capture. ${errorMessage}`);
      return { success: false, error: new Error(errorMessage), message: errorMessage };
    },
  },
];

/**
 * State Management Commands
 */
export const stateCommands: IUICommand<SetStateParams | GetStateParams, unknown | void>[] = [
  {
    id: 'setState',
    name: 'Set State',
    description: 'Set a state value',
    category: 'state',
    isUndoable: true, // Potentially undoable if previous state is captured.
    execute: async (params: SetStateParams, context: ICommandContext): Promise<CommandResult<void>> => {
      try {
        await context.state.setState(params.key, params.value);
        context.logger?.info(`State ${params.key} set`);
        return { success: true, data: undefined, message: `State ${params.key} set` };
      } catch (error) {
        context.logger?.error(`Failed to set state ${params.key}`, error as Error);
        return { success: false, error: error as Error, message: `Failed to set state ${params.key}: ${(error as Error).message}` };
      }
    },
    undo: async (params: SetStateParams, context: ICommandContext): Promise<CommandResult<void>> => {
      // Similar to updateData, requires storing the previous value.
      const errorMessage = "Undo for 'setState' is not fully implemented: Requires previous state capture.";
      context.logger?.warn(`Undo for setState on key ${params.key} is a placeholder and requires state capture. ${errorMessage}`);
      return { success: false, error: new Error(errorMessage), message: errorMessage };
    },
  },
  {
    id: 'getState',
    name: 'Get State',
    description: 'Get a state value',
    category: 'state',
    isUndoable: false, // Read operation.
    execute: async <TValue>(params: GetStateParams, context: ICommandContext): Promise<CommandResult<TValue | undefined>> => {
      try {
        const value = await context.state.getState<TValue>(params.key);
        context.logger?.info(`State ${params.key} retrieved`);
        return { success: true, data: value, message: `State ${params.key} retrieved` };
      } catch (error) {
        context.logger?.error(`Failed to get state ${params.key}`, error as Error);
        return { success: false, error: error as Error, message: `Failed to get state ${params.key}: ${(error as Error).message}` };
      }
    },
  },
];

/**
 * Union type representing any possible UI Command.
 * This provides type safety for arrays that hold different specific command types.
 */
export type AnyUICommand =
  | IUICommand<NavigateParams, void>
  | IUICommand<GoBackParams, void>
  | IUICommand<ShowComponentParams, void>
  | IUICommand<HideComponentParams, void>
  | IUICommand<UpdateComponentPropsParams, void>
  | IUICommand<OpenModalParams<any>, void> // Use any for props here as it's a union
  | IUICommand<CloseModalParams, void>
  | IUICommand<ShowToastParams, void>
  | IUICommand<ShowAlertParams, void>
  | IUICommand<FetchDataParams, unknown>
  | IUICommand<UpdateDataParams, void>
  | IUICommand<SetStateParams, void>
  | IUICommand<GetStateParams, unknown | undefined>;


/**
 * All available commands aggregated from different categories.
 */
export const allCommands: AnyUICommand[] = [
  ...(navigationCommands as AnyUICommand[]),
  ...(uiCommands as AnyUICommand[]),
  ...(modalCommands as AnyUICommand[]),
  ...(notificationCommands as AnyUICommand[]),
  ...(dataCommands as AnyUICommand[]),
  ...(stateCommands as AnyUICommand[]),
];

// --- 4. Command Registry and Executor ---

/**
 * The Command Registry manages all available UI commands.
 * It provides methods to register, retrieve, and execute commands using a provided context.
 */
export class UICommandRegistry {
  private commands: Map<string, AnyUICommand> = new Map();
  private commandContext: ICommandContext; // Store the context for all commands

  /**
   * Initializes the registry with a mandatory ICommandContext.
   * This context will be passed to every executed command.
   * @param context The ICommandContext providing external dependencies.
   */
  constructor(context: ICommandContext) {
    if (!context) {
      throw new Error("UICommandRegistry must be initialized with a valid ICommandContext.");
    }
    this.commandContext = context;
    this.registerCommands(allCommands);
  }

  /**
   * Registers a list of commands. Overwrites existing commands with the same ID.
   * @param commands An array of IUICommand instances.
   */
  registerCommands(commands: AnyUICommand[]) {
    commands.forEach(cmd => this.commands.set(cmd.id, cmd));
  }

  /**
   * Registers a single command. Overwrites an existing command with the same ID.
   * @param command An IUICommand instance.
   */
  registerCommand(command: AnyUICommand) {
    this.commands.set(command.id, command);
  }

  /**
   * Retrieves a command by its ID.
   * @param id The ID of the command.
   * @returns The IUICommand instance or undefined if not found.
   */
  getCommand(id: string): AnyUICommand | undefined {
    return this.commands.get(id);
  }

  /**
   * Retrieves all registered commands.
   * @returns An array of all IUICommand instances.
   */
  getAllCommands(): AnyUICommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Retrieves commands filtered by category.
   * @param category The category to filter by.
   * @returns An array of IUICommand instances belonging to the specified category.
   */
  getCommandsByCategory(category: CommandCategory): AnyUICommand[] {
    return this.getAllCommands().filter(cmd => cmd.category === category);
  }

  /**
   * Executes a command by its ID with the given parameters.
   * The command's execute method will receive the parameters and the registry's ICommandContext.
   * @param id The ID of the command to execute.
   * @param params The parameters for the command.
   * @returns A Promise resolving to a CommandResult, indicating success or failure.
   */
  async executeCommand<TParams extends Record<string, unknown> = Record<string, unknown>, TData = unknown, TError extends Error = Error>(
    id: string,
    params?: TParams
  ): Promise<CommandResult<TData, TError>> {
    const command = this.getCommand(id);
    if (!command) {
      const error = new Error(`Command ${id} not found`);
      this.commandContext.logger?.error(error.message, error);
      return {
        success: false,
        error: error as TError,
        message: error.message,
      };
    }

    try {
      // The `execute` method of `AnyUICommand` is a union of specific `execute` methods.
      // TypeScript can infer the specific type if command is narrowed, or allow usage
      // with a generic `Record<string, unknown>` for params.
      const result = await command.execute(params || {}, this.commandContext) as CommandResult<TData, TError>;
      if (!result.success) {
        this.commandContext.logger?.error(`Command ${id} failed: ${result.message}`, result.error);
      }
      return result;
    } catch (error) {
      this.commandContext.logger?.error(`Failed to execute command ${id} unexpectedly`, error as Error);
      return {
        success: false,
        error: error as TError,
        message: `Failed to execute command ${id} unexpectedly: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Executes the undo function of a command.
   * This assumes the command was previously executed and its parameters are available.
   * @param id The ID of the command to undo.
   * @param params The original parameters used to execute the command.
   * @returns A Promise resolving to a CommandResult for the undo operation.
   */
  async undoCommand<TParams extends Record<string, unknown> = Record<string, unknown>, TError extends Error = Error>(
    id: string,
    params?: TParams
  ): Promise<CommandResult<void, TError>> {
    const command = this.getCommand(id);
    if (!command) {
      const error = new Error(`Command ${id} not found for undo`);
      this.commandContext.logger?.error(error.message, error);
      return {
        success: false,
        error: error as TError,
        message: error.message,
      };
    }
    if (!command.isUndoable || !command.undo) {
      const error = new Error(`Command ${id} is not undoable or has no undo implementation`);
      this.commandContext.logger?.warn(error.message);
      return {
        success: false,
        error: error as TError,
        message: error.message,
      };
    }

    try {
      const result = await command.undo(params || {}, this.commandContext) as CommandResult<void, TError>;
      if (!result.success) {
        this.commandContext.logger?.error(`Undo for command ${id} failed: ${result.message}`, result.error);
      } else {
        this.commandContext.logger?.info(`Undo for command ${id} successful: ${result.message}`);
      }
      return result;
    } catch (error) {
      this.commandContext.logger?.error(`Failed to undo command ${id} unexpectedly`, error as Error);
      return {
        success: false,
        error: error as TError,
        message: `Failed to undo command ${id} unexpectedly: ${(error as Error).message}`,
      };
    }
  }
}

// --- 5. Mock/Default Implementations for ICommandContext Services ---
// These are placeholder implementations for development/testing.
// In a real application, you would provide concrete services (e.g., KintoneRouterService, AxiosDataService),
// typically in a separate file (e.g., `src/kintone-integration/kintone-command-context.ts`)
// and inject them at your application's entry point.

class MockRouterService implements IRouterService {
  async navigate(path: string, options?: { replace?: boolean }): Promise<void> {
    console.log(`[Mock] Router: Navigating to ${path} (replace: ${options?.replace})`);
  }
  async goBack(): Promise<void> {
    console.log('[Mock] Router: Going back');
  }
}

class MockUIService implements IUIService {
  async showComponent(componentId: string): Promise<void> { console.log(`[Mock] UI: Showing ${componentId}`); }
  async hideComponent(componentId: string): Promise<void> { console.log(`[Mock] UI: Hiding ${componentId}`); }
  async updateComponentProps(componentId: string, props: Record<string, unknown>): Promise<void> { console.log(`[Mock] UI: Updating props for ${componentId}`, props); }
}

class MockModalService implements IModalService {
  async openModal<TProps extends Record<string, unknown>>(modalId: string, props?: TProps): Promise<void> { console.log(`[Mock] Modal: Opening ${modalId}`, props); }
  async closeModal(): Promise<void> { console.log('[Mock] Modal: Closing current modal'); }
}

class MockNotificationService implements INotificationService {
  async showToast(message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number): Promise<void> { console.log(`[Mock] Notification: Toast "${message}" (${type}, ${duration})`); }
  async showAlert(title: string, message: string, type?: 'success' | 'error' | 'warning' | 'info'): Promise<void> { console.log(`[Mock] Notification: Alert "${title} - ${message}" (${type})`); }
}

class MockDataService implements IDataService {
  async fetchData<TResult = unknown>(endpoint: string, method?: string, body?: unknown, headers?: Record<string, string>): Promise<TResult> {
    console.log(`[Mock] Data: Fetching from ${endpoint} (method: ${method}, body:`, body, `headers:`, headers);
    return Promise.resolve({} as TResult); // Return empty object as a placeholder
  }
  async updateData<TData = unknown>(storeKey: string, data: TData): Promise<void> {
    console.log(`[Mock] Data: Updating ${storeKey} with`, data);
  }
}

class MockStateService implements IStateService {
  private _state: Record<string, unknown> = {};
  async setState<TValue = unknown>(key: string, value: TValue): Promise<void> {
    this._state[key] = value;
    console.log(`[Mock] State: Set ${key} to`, value);
  }
  async getState<TValue = unknown>(key: string): Promise<TValue | undefined> {
    console.log(`[Mock] State: Get ${key}, current value:`, this._state[key]);
    return Promise.resolve(this._state[key] as TValue | undefined);
  }
}

class MockLoggerService implements ILoggerService {
  info(message: string, ...args: unknown[]): void { console.log(`[INFO] ${message}`, ...args); }
  warn(message: string, ...args: unknown[]): void { console.warn(`[WARN] ${message}`, ...args); }
  error(message: string, error?: Error, ...args: unknown[]): void { console.error(`[ERROR] ${message}`, error, ...args); }
  debug(message: string, ...args: unknown[]): void { console.debug(`[DEBUG] ${message}`, ...args); }
}

// Create a default mock context for the singleton instance
const defaultMockCommandContext: ICommandContext = {
  router: new MockRouterService(),
  ui: new MockUIService(),
  modal: new MockModalService(),
  notification: new MockNotificationService(),
  data: new MockDataService(),
  state: new MockStateService(),
  logger: new MockLoggerService(),
};

// Singleton instance
// In a real application, you would instantiate UICommandRegistry with your
// concrete, Kintone-specific (or other environment-specific) ICommandContext implementation
// at your application's entry point, like this:
// export const uiCommandRegistry = new UICommandRegistry(new KintoneCommandContext());
// For this example, we use the default mock context.
export const uiCommandRegistry = new UICommandRegistry(defaultMockCommandContext);