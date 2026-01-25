/**
 * UI Command System - Copilot-style function calling interface
 * Enables programmatic UI control and screen manipulation
 */

export interface UICommand {
  id: string;
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
  category: 'navigation' | 'ui' | 'data' | 'modal' | 'notification' | 'state';
}

export interface UICommandParams {
  [key: string]: any;
}

export interface UICommandResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: Error;
}

export type UICommandExecutor = (command: string, params?: UICommandParams) => Promise<UICommandResult>;

/**
 * Navigation Commands
 */
export const navigationCommands: UICommand[] = [
  {
    id: 'navigate',
    name: 'Navigate',
    description: 'Navigate to a specific route',
    category: 'navigation',
    execute: async (params: { path: string; replace?: boolean }) => {
      // Will be implemented with router context
      return { success: true, message: `Navigating to ${params.path}` };
    },
  },
  {
    id: 'goBack',
    name: 'Go Back',
    description: 'Navigate to previous page',
    category: 'navigation',
    execute: async () => {
      return { success: true, message: 'Navigating back' };
    },
  },
];

/**
 * UI Manipulation Commands
 */
export const uiCommands: UICommand[] = [
  {
    id: 'showComponent',
    name: 'Show Component',
    description: 'Show a specific component',
    category: 'ui',
    execute: async (params: { componentId: string }) => {
      return { success: true, message: `Showing component ${params.componentId}` };
    },
  },
  {
    id: 'hideComponent',
    name: 'Hide Component',
    description: 'Hide a specific component',
    category: 'ui',
    execute: async (params: { componentId: string }) => {
      return { success: true, message: `Hiding component ${params.componentId}` };
    },
  },
  {
    id: 'updateComponentProps',
    name: 'Update Component Props',
    description: 'Update props of a component',
    category: 'ui',
    execute: async (params: { componentId: string; props: Record<string, any> }) => {
      return { success: true, message: `Updated component ${params.componentId}` };
    },
  },
];

/**
 * Modal Commands
 */
export const modalCommands: UICommand[] = [
  {
    id: 'openModal',
    name: 'Open Modal',
    description: 'Open a modal dialog',
    category: 'modal',
    execute: async (params: { modalId: string; props?: Record<string, any> }) => {
      return { success: true, message: `Opening modal ${params.modalId}` };
    },
  },
  {
    id: 'closeModal',
    name: 'Close Modal',
    description: 'Close the current modal',
    category: 'modal',
    execute: async () => {
      return { success: true, message: 'Closing modal' };
    },
  },
];

/**
 * Notification Commands
 */
export const notificationCommands: UICommand[] = [
  {
    id: 'showToast',
    name: 'Show Toast',
    description: 'Show a toast notification',
    category: 'notification',
    execute: async (params: { message: string; type?: 'success' | 'error' | 'warning' | 'info'; duration?: number }) => {
      return { success: true, message: 'Toast shown' };
    },
  },
  {
    id: 'showAlert',
    name: 'Show Alert',
    description: 'Show an alert dialog',
    category: 'notification',
    execute: async (params: { title: string; message: string; type?: 'success' | 'error' | 'warning' | 'info' }) => {
      return { success: true, message: 'Alert shown' };
    },
  },
];

/**
 * Data Commands
 */
export const dataCommands: UICommand[] = [
  {
    id: 'fetchData',
    name: 'Fetch Data',
    description: 'Fetch data from an API',
    category: 'data',
    execute: async (params: { endpoint: string; method?: string; body?: any }) => {
      return { success: true, message: 'Data fetched', data: {} };
    },
  },
  {
    id: 'updateData',
    name: 'Update Data',
    description: 'Update data in the store',
    category: 'data',
    execute: async (params: { storeKey: string; data: any }) => {
      return { success: true, message: 'Data updated' };
    },
  },
];

/**
 * State Management Commands
 */
export const stateCommands: UICommand[] = [
  {
    id: 'setState',
    name: 'Set State',
    description: 'Set a state value',
    category: 'state',
    execute: async (params: { key: string; value: any }) => {
      return { success: true, message: `State ${params.key} set` };
    },
  },
  {
    id: 'getState',
    name: 'Get State',
    description: 'Get a state value',
    category: 'state',
    execute: async (params: { key: string }) => {
      return { success: true, message: `State ${params.key} retrieved`, data: null };
    },
  },
];

/**
 * All available commands
 */
export const allCommands: UICommand[] = [
  ...navigationCommands,
  ...uiCommands,
  ...modalCommands,
  ...notificationCommands,
  ...dataCommands,
  ...stateCommands,
];

/**
 * Command Registry
 */
export class UICommandRegistry {
  private commands: Map<string, UICommand> = new Map();

  constructor() {
    this.registerCommands(allCommands);
  }

  registerCommands(commands: UICommand[]) {
    commands.forEach(cmd => this.commands.set(cmd.id, cmd));
  }

  registerCommand(command: UICommand) {
    this.commands.set(command.id, command);
  }

  getCommand(id: string): UICommand | undefined {
    return this.commands.get(id);
  }

  getAllCommands(): UICommand[] {
    return Array.from(this.commands.values());
  }

  getCommandsByCategory(category: UICommand['category']): UICommand[] {
    return this.getAllCommands().filter(cmd => cmd.category === category);
  }

  async executeCommand(id: string, params?: UICommandParams): Promise<UICommandResult> {
    const command = this.getCommand(id);
    if (!command) {
      return {
        success: false,
        error: new Error(`Command ${id} not found`),
        message: `Command ${id} not found`,
      };
    }

    try {
      const result = await command.execute(params || {});
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        message: `Failed to execute command ${id}: ${(error as Error).message}`,
      };
    }
  }
}

// Singleton instance
export const uiCommandRegistry = new UICommandRegistry();
