/**
 * AI 函數執行器 Hook
 * 負責執行 AI 回傳的函數呼叫
 */

import { useCallback } from 'react';
import type { ViewKey } from '../store/useAppStore'; // 僅導入類型，不導入 store 實例
import { createWidgetInstance } from '../lib/dashboardUtils';
import type {
  FunctionCall,
  NavigateArguments,
  ShowCustomerDataArguments,
  ShowQuotationArguments,
  ShowItineraryArguments,
  SetDashboardEditModeArguments,
  AddDashboardWidgetArguments,
  RemoveDashboardWidgetArguments,
  UpdateDashboardWidgetArguments,
} from '../types/ai';
import type { Widget, WidgetLibraryItem } from '../types/dashboard'; // 假設這些類型存在於此路徑

// --------------------------------------------------------------------------------
// 函數執行結果介面
// --------------------------------------------------------------------------------
export interface FunctionExecutionResult {
  success: boolean;
  functionName: string;
  message?: string;
  error?: unknown; // 新增錯誤物件，用於更詳細的日誌記錄或處理
}

// --------------------------------------------------------------------------------
// 訊息常數 (取代硬編碼中文，並為 i18n 預留空間)
// --------------------------------------------------------------------------------
const EXECUTION_MESSAGES = {
  NAVIGATE_SUCCESS: (viewKey: ViewKey) => `Successfully navigated to ${viewKey}.`,
  NAVIGATE_INVALID_VIEW: (viewKey: string) => `Invalid page key: ${viewKey}.`,
  SHOW_CUSTOMER_SUCCESS_SEARCH: (query: string) => `Customer data page opened, searching for: ${query}.`,
  SHOW_CUSTOMER_SUCCESS: 'Customer data page opened.',
  SHOW_QUOTATION_SUCCESS_DEST: (destination: string) => `Quotation page opened, destination: ${destination}.`,
  SHOW_QUOTATION_SUCCESS: 'Quotation page opened.',
  SHOW_ITINERARY_SUCCESS_SESSION: (sessionId: string) => `Itinerary page opened, session: ${sessionId}.`,
  SHOW_ITINERARY_SUCCESS: 'Itinerary page opened.',
  DASHBOARD_EDIT_MODE_ENABLED: 'Dashboard edit mode enabled.',
  DASHBOARD_EDIT_MODE_DISABLED: 'Dashboard edit mode disabled.',
  ADD_WIDGET_SUCCESS: (title: string) => `Widget added: ${title}.`,
  ADD_WIDGET_TYPE_NOT_FOUND: (type: string) => `Widget type not found: ${type}.`,
  REMOVE_WIDGET_SUCCESS: (id: string) => `Widget removed: ${id}.`,
  REMOVE_WIDGET_NOT_FOUND: (id: string) => `Widget not found: ${id}.`,
  UPDATE_WIDGET_SUCCESS: (id: string) => `Widget updated: ${id}.`,
  UPDATE_WIDGET_NOT_FOUND: (id: string) => `Widget not found: ${id}.`,
  UNKNOWN_FUNCTION: (name: string) => `Unknown function: ${name}.`,
  GENERIC_ERROR: (name: string, error: unknown) => `An error occurred during ${name} execution: ${String(error)}.`,
};

// --------------------------------------------------------------------------------
// 配置屬性介面 (Config Props)
// 將外部依賴注入，實現獨立性與 SRP
// --------------------------------------------------------------------------------
export interface UseFunctionExecutorConfig {
  // 應用層級的狀態與動作 (從 useAppStore 提取)
  setCurrentView: (view: ViewKey) => void;
  setSelectedSession: (sessionId: string | null) => void;
  validViewKeys: ViewKey[]; // 導航頁面鍵值，從外部配置傳入，避免硬編碼

  // 儀表板層級的狀態與動作 (從 useDashboardStore 提取)
  getDashboardState: () => { // 提供一個獲取當前儀表板狀態的 getter
    widgets: Widget[];
    availableWidgets: WidgetLibraryItem[];
  };
  setDashboardEditMode: (enabled: boolean) => void;
  addDashboardWidget: (widget: Widget) => void;
  removeDashboardWidget: (widgetId: string) => void;
  updateDashboardWidgetConfig: (widgetId: string, config: any) => void;
  updateDashboardWidgetLayout: (widgetId: string, layout: any) => void;
  updateDashboardWidgetTitle: (widgetId: string, title: string) => void;

  // 日誌記錄機制 (logger)
  logger?: {
    error: (...args: any[]) => void;
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
  };
}

// --------------------------------------------------------------------------------
// 預設日誌記錄器 (fallback)
// --------------------------------------------------------------------------------
const defaultLogger = {
  error: console.error,
  info: console.info,
  warn: console.warn,
};

// --------------------------------------------------------------------------------
// 函數執行器 Hook
// --------------------------------------------------------------------------------
/**
 * AI 函數執行器 Hook
 * 提供執行 AI 函數呼叫的能力，透過配置注入外部依賴。
 *
 * @param config - 包含所有必要依賴 (如 store actions, state getters, 日誌器) 的配置物件。
 */
export function useFunctionExecutor(config: UseFunctionExecutorConfig) {
  const {
    setCurrentView,
    setSelectedSession,
    validViewKeys,
    getDashboardState,
    setDashboardEditMode,
    addDashboardWidget,
    removeDashboardWidget,
    updateDashboardWidgetConfig,
    updateDashboardWidgetLayout,
    updateDashboardWidgetTitle,
    logger = defaultLogger, // 使用傳入的 logger 或 fallback 到預設
  } = config;

  /**
   * 處理導航至指定頁面。
   * 職責單一：僅負責頁面導航。
   */
  const handleNavigate = useCallback(
    (args: NavigateArguments): FunctionExecutionResult => {
      try {
        if (!args.viewKey || !validViewKeys.includes(args.viewKey)) {
          logger.warn(`Navigate failed: ${EXECUTION_MESSAGES.NAVIGATE_INVALID_VIEW(args.viewKey)}`);
          return {
            success: false,
            functionName: 'navigate',
            message: EXECUTION_MESSAGES.NAVIGATE_INVALID_VIEW(args.viewKey),
          };
        }

        setCurrentView(args.viewKey);
        logger.info(`Navigate successful: ${EXECUTION_MESSAGES.NAVIGATE_SUCCESS(args.viewKey)}`);
        return {
          success: true,
          functionName: 'navigate',
          message: EXECUTION_MESSAGES.NAVIGATE_SUCCESS(args.viewKey),
        };
      } catch (error) {
        logger.error(`Error in navigate function:`, error);
        return {
          success: false,
          functionName: 'navigate',
          message: EXECUTION_MESSAGES.GENERIC_ERROR('navigate', error),
          error,
        };
      }
    },
    [setCurrentView, validViewKeys, logger]
  );

  /**
   * 處理顯示客戶資料（導航至 CRM 頁面）。
   * 職責單一：僅負責導航至 CRM。
   */
  const handleShowCustomerData = useCallback(
    (args: ShowCustomerDataArguments): FunctionExecutionResult => {
      try {
        setCurrentView('crm'); // 固定導航到 'crm'
        const message = args.searchQuery
          ? EXECUTION_MESSAGES.SHOW_CUSTOMER_SUCCESS_SEARCH(args.searchQuery)
          : EXECUTION_MESSAGES.SHOW_CUSTOMER_SUCCESS;

        logger.info(`ShowCustomerData successful: ${message}`);
        return {
          success: true,
          functionName: 'showCustomerData',
          message: message,
        };
      } catch (error) {
        logger.error(`Error in showCustomerData function:`, error);
        return {
          success: false,
          functionName: 'showCustomerData',
          message: EXECUTION_MESSAGES.GENERIC_ERROR('showCustomerData', error),
          error,
        };
      }
    },
    [setCurrentView, logger]
  );

  /**
   * 處理顯示報價頁面。
   * 職責單一：僅負責導航至報價頁面。
   */
  const handleShowQuotation = useCallback(
    (args: ShowQuotationArguments): FunctionExecutionResult => {
      try {
        setCurrentView('quotation'); // 固定導航到 'quotation'
        const message = args.destination
          ? EXECUTION_MESSAGES.SHOW_QUOTATION_SUCCESS_DEST(args.destination)
          : EXECUTION_MESSAGES.SHOW_QUOTATION_SUCCESS;

        logger.info(`ShowQuotation successful: ${message}`);
        return {
          success: true,
          functionName: 'showQuotation',
          message: message,
        };
      } catch (error) {
        logger.error(`Error in showQuotation function:`, error);
        return {
          success: false,
          functionName: 'showQuotation',
          message: EXECUTION_MESSAGES.GENERIC_ERROR('showQuotation', error),
          error,
        };
      }
    },
    [setCurrentView, logger]
  );

  /**
   * 處理顯示行程。
   * 職責單一：僅負責導航至行程頁面並設定團次。
   */
  const handleShowItinerary = useCallback(
    (args: ShowItineraryArguments): FunctionExecutionResult => {
      try {
        setCurrentView('itinerary'); // 固定導航到 'itinerary'

        if (args.sessionId) {
          setSelectedSession(args.sessionId);
        }

        const message = args.sessionId
          ? EXECUTION_MESSAGES.SHOW_ITINERARY_SUCCESS_SESSION(args.sessionId)
          : EXECUTION_MESSAGES.SHOW_ITINERARY_SUCCESS;

        logger.info(`ShowItinerary successful: ${message}`);
        return {
          success: true,
          functionName: 'showItinerary',
          message: message,
        };
      } catch (error) {
        logger.error(`Error in showItinerary function:`, error);
        return {
          success: false,
          functionName: 'showItinerary',
          message: EXECUTION_MESSAGES.GENERIC_ERROR('showItinerary', error),
          error,
        };
      }
    },
    [setCurrentView, setSelectedSession, logger]
  );

  /**
   * 處理儀表板相關的函數呼叫。
   * 將所有儀表板操作集中於此，遵循單一職責原則。
   */
  const handleDashboardFunction = useCallback(
    (call: FunctionCall): FunctionExecutionResult => {
      // 在執行前動態獲取當前儀表板狀態，確保獲取到最新數據
      const { widgets, availableWidgets } = getDashboardState();

      try {
        switch (call.name) {
          case 'setDashboardEditMode': {
            const args = call.arguments as SetDashboardEditModeArguments;
            setDashboardEditMode(Boolean(args.enabled));
            const message = args.enabled
              ? EXECUTION_MESSAGES.DASHBOARD_EDIT_MODE_ENABLED
              : EXECUTION_MESSAGES.DASHBOARD_EDIT_MODE_DISABLED;
            logger.info(`SetDashboardEditMode successful: ${message}`);
            return {
              success: true,
              functionName: 'setDashboardEditMode',
              message: message,
            };
          }
          case 'addDashboardWidget': {
            const args = call.arguments as AddDashboardWidgetArguments;
            const libraryItem = availableWidgets.find((item) => item.type === args.type);
            if (!libraryItem) {
              logger.warn(`AddDashboardWidget failed: ${EXECUTION_MESSAGES.ADD_WIDGET_TYPE_NOT_FOUND(args.type)}`);
              return {
                success: false,
                functionName: 'addDashboardWidget',
                message: EXECUTION_MESSAGES.ADD_WIDGET_TYPE_NOT_FOUND(args.type),
              };
            }
            const widget = createWidgetInstance(libraryItem, {
              title: args.title,
              config: args.config,
              layout: args.layout ? { ...libraryItem.defaultLayout, ...args.layout } : undefined,
            });
            addDashboardWidget(widget);
            logger.info(`AddDashboardWidget successful: ${EXECUTION_MESSAGES.ADD_WIDGET_SUCCESS(widget.title)}`);
            return {
              success: true,
              functionName: 'addDashboardWidget',
              message: EXECUTION_MESSAGES.ADD_WIDGET_SUCCESS(widget.title),
            };
          }
          case 'removeDashboardWidget': {
            const args = call.arguments as RemoveDashboardWidgetArguments;
            const exists = widgets.some((widget) => widget.id === args.id);
            if (!exists) {
              logger.warn(`RemoveDashboardWidget failed: ${EXECUTION_MESSAGES.REMOVE_WIDGET_NOT_FOUND(args.id)}`);
              return {
                success: false,
                functionName: 'removeDashboardWidget',
                message: EXECUTION_MESSAGES.REMOVE_WIDGET_NOT_FOUND(args.id),
              };
            }
            removeDashboardWidget(args.id);
            logger.info(`RemoveDashboardWidget successful: ${EXECUTION_MESSAGES.REMOVE_WIDGET_SUCCESS(args.id)}`);
            return {
              success: true,
              functionName: 'removeDashboardWidget',
              message: EXECUTION_MESSAGES.REMOVE_WIDGET_SUCCESS(args.id),
            };
          }
          case 'updateDashboardWidget': {
            const args = call.arguments as UpdateDashboardWidgetArguments;
            const existingWidget = widgets.find((widget) => widget.id === args.id);
            if (!existingWidget) {
              logger.warn(`UpdateDashboardWidget failed: ${EXECUTION_MESSAGES.UPDATE_WIDGET_NOT_FOUND(args.id)}`);
              return {
                success: false,
                functionName: 'updateDashboardWidget',
                message: EXECUTION_MESSAGES.UPDATE_WIDGET_NOT_FOUND(args.id),
              };
            }
            if (args.title) {
              updateDashboardWidgetTitle(args.id, args.title);
            }
            if (args.config) {
              updateDashboardWidgetConfig(args.id, args.config);
            }
            if (args.layout) {
              updateDashboardWidgetLayout(args.id, args.layout);
            }
            logger.info(`UpdateDashboardWidget successful: ${EXECUTION_MESSAGES.UPDATE_WIDGET_SUCCESS(args.id)}`);
            return {
              success: true,
              functionName: 'updateDashboardWidget',
              message: EXECUTION_MESSAGES.UPDATE_WIDGET_SUCCESS(args.id),
            };
          }
          default:
            // 如果儀表板函數處理器收到了它不認識的函數，這應該被視為錯誤或未預期的情況
            logger.warn(`Unknown dashboard function: ${call.name}`);
            return {
              success: false,
              functionName: call.name,
              message: EXECUTION_MESSAGES.UNKNOWN_FUNCTION(call.name),
            };
        }
      } catch (error) {
        logger.error(`Error in dashboard function ${call.name}:`, error);
        return {
          success: false,
          functionName: call.name,
          message: EXECUTION_MESSAGES.GENERIC_ERROR(call.name, error),
          error,
        };
      }
    },
    [
      getDashboardState,
      setDashboardEditMode,
      addDashboardWidget,
      removeDashboardWidget,
      updateDashboardWidgetConfig,
      updateDashboardWidgetLayout,
      updateDashboardWidgetTitle,
      logger,
    ]
  );

  /**
   * 執行單一函數呼叫。
   * 作為一個路由分發器，將呼叫委派給相應的處理器，減輕自身職責。
   */
  const executeFunction = useCallback(
    (call: FunctionCall): FunctionExecutionResult => {
      switch (call.name) {
        // 核心導航與應用層級功能
        case 'navigate':
          return handleNavigate(call.arguments as NavigateArguments);
        case 'showCustomerData':
          return handleShowCustomerData(call.arguments as ShowCustomerDataArguments);
        case 'showQuotation':
          return handleShowQuotation(call.arguments as ShowQuotationArguments);
        case 'showItinerary':
          return handleShowItinerary(call.arguments as ShowItineraryArguments);

        // 儀表板專用功能，委派給 handleDashboardFunction 處理
        case 'setDashboardEditMode':
        case 'addDashboardWidget':
        case 'removeDashboardWidget':
        case 'updateDashboardWidget':
          return handleDashboardFunction(call);

        default:
          logger.warn(`ExecuteFunction failed: ${EXECUTION_MESSAGES.UNKNOWN_FUNCTION(call.name)}`);
          return {
            success: false,
            functionName: call.name,
            message: EXECUTION_MESSAGES.UNKNOWN_FUNCTION(call.name),
          };
      }
    },
    [
      handleNavigate,
      handleShowCustomerData,
      handleShowQuotation,
      handleShowItinerary,
      handleDashboardFunction,
      logger,
    ]
  );

  /**
   * 執行多個函數呼叫。
   */
  const executeFunctions = useCallback(
    (calls: FunctionCall[]): FunctionExecutionResult[] => {
      return calls.map(executeFunction);
    },
    [executeFunction]
  );

  return {
    executeFunction,
    executeFunctions,
  };
}