/**
 * AI 函數執行器 Hook
 * 負責執行 AI 回傳的函數呼叫
 */

import { useCallback } from 'react';
import { useAppStore, type ViewKey } from '../store/useAppStore';
import { useDashboardStore } from '../store/useDashboardStore';
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

// 函數執行結果
export interface FunctionExecutionResult {
  success: boolean;
  functionName: string;
  message?: string;
}

/**
 * 函數執行器 Hook
 * 提供執行 AI 函數呼叫的能力
 */
export function useFunctionExecutor() {
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const setSelectedSession = useAppStore((state) => state.setSelectedSession);
  const {
    widgets,
    availableWidgets,
    setEditMode,
    addWidget,
    removeWidget,
    updateWidgetConfig,
    updateWidgetLayout,
    updateWidgetTitle,
  } = useDashboardStore();

  /**
   * 導航至指定頁面
   */
  const handleNavigate = useCallback(
    (args: NavigateArguments): FunctionExecutionResult => {
      const validViewKeys: ViewKey[] = [
        'dashboard', 'sessions', 'planner', 'crm', 'payments', 'passport',
        'costing', 'insurance', 'quotation', 'operations', 'expense', 'chat',
        'estimator', 'map', 'welfare', 'builder', 'traveler', 'itinerary',
        'voting', 'briefing', 'addons', 'footprint', 'tour-management', 'ai-copilot',
      ];

      if (!args.viewKey || !validViewKeys.includes(args.viewKey)) {
        return {
          success: false,
          functionName: 'navigate',
          message: `無效的頁面: ${args.viewKey}`,
        };
      }

      setCurrentView(args.viewKey);
      return {
        success: true,
        functionName: 'navigate',
        message: `已導航至 ${args.viewKey}`,
      };
    },
    [setCurrentView]
  );

  /**
   * 顯示客戶資料（導航至 CRM 頁面）
   */
  const handleShowCustomerData = useCallback(
    (args: ShowCustomerDataArguments): FunctionExecutionResult => {
      // 導航到 CRM 頁面
      setCurrentView('crm');

      // TODO: 如果有 searchQuery，可以設定搜尋條件
      // 這需要擴展 store 來支援 CRM 搜尋狀態

      return {
        success: true,
        functionName: 'showCustomerData',
        message: args.searchQuery
          ? `已開啟客戶資料，搜尋: ${args.searchQuery}`
          : '已開啟客戶資料頁面',
      };
    },
    [setCurrentView]
  );

  /**
   * 顯示報價頁面
   */
  const handleShowQuotation = useCallback(
    (args: ShowQuotationArguments): FunctionExecutionResult => {
      // 導航到報價頁面
      setCurrentView('quotation');

      // TODO: 如果有 destination，可以預填目的地

      return {
        success: true,
        functionName: 'showQuotation',
        message: args.destination
          ? `已開啟報價計算，目的地: ${args.destination}`
          : '已開啟報價計算頁面',
      };
    },
    [setCurrentView]
  );

  /**
   * 顯示行程
   */
  const handleShowItinerary = useCallback(
    (args: ShowItineraryArguments): FunctionExecutionResult => {
      // 導航到行程頁面
      setCurrentView('itinerary');

      // 如果有指定 sessionId，設定選中的團次
      if (args.sessionId) {
        setSelectedSession(args.sessionId);
      }

      return {
        success: true,
        functionName: 'showItinerary',
        message: args.sessionId
          ? `已開啟行程，團次: ${args.sessionId}`
          : '已開啟行程頁面',
      };
    },
    [setCurrentView, setSelectedSession]
  );

  /**
   * 執行單一函數呼叫
   */
  const executeFunction = useCallback(
    (call: FunctionCall): FunctionExecutionResult => {
      switch (call.name) {
        case 'navigate':
          return handleNavigate(call.arguments as NavigateArguments);
        case 'showCustomerData':
          return handleShowCustomerData(call.arguments as ShowCustomerDataArguments);
        case 'showQuotation':
          return handleShowQuotation(call.arguments as ShowQuotationArguments);
        case 'showItinerary':
          return handleShowItinerary(call.arguments as ShowItineraryArguments);
        case 'setDashboardEditMode': {
          const args = call.arguments as SetDashboardEditModeArguments;
          setEditMode(Boolean(args.enabled));
          return {
            success: true,
            functionName: 'setDashboardEditMode',
            message: `已${args.enabled ? '啟用' : '關閉'}儀表板編輯模式`,
          };
        }
        case 'addDashboardWidget': {
          const args = call.arguments as AddDashboardWidgetArguments;
          const libraryItem = availableWidgets.find((item) => item.type === args.type);
          if (!libraryItem) {
            return {
              success: false,
              functionName: 'addDashboardWidget',
              message: `找不到 Widget 類型: ${args.type}`,
            };
          }
          const widget = createWidgetInstance(libraryItem, {
            title: args.title,
            config: args.config,
            layout: args.layout ? { ...libraryItem.defaultLayout, ...args.layout } : undefined,
          });
          addWidget(widget);
          return {
            success: true,
            functionName: 'addDashboardWidget',
            message: `已新增 Widget：${widget.title}`,
          };
        }
        case 'removeDashboardWidget': {
          const args = call.arguments as RemoveDashboardWidgetArguments;
          const exists = widgets.some((widget) => widget.id === args.id);
          if (!exists) {
            return {
              success: false,
              functionName: 'removeDashboardWidget',
              message: `找不到 Widget: ${args.id}`,
            };
          }
          removeWidget(args.id);
          return {
            success: true,
            functionName: 'removeDashboardWidget',
            message: `已移除 Widget: ${args.id}`,
          };
        }
        case 'updateDashboardWidget': {
          const args = call.arguments as UpdateDashboardWidgetArguments;
          const exists = widgets.find((widget) => widget.id === args.id);
          if (!exists) {
            return {
              success: false,
              functionName: 'updateDashboardWidget',
              message: `找不到 Widget: ${args.id}`,
            };
          }
          if (args.title) {
            updateWidgetTitle(args.id, args.title);
          }
          if (args.config) {
            updateWidgetConfig(args.id, args.config);
          }
          if (args.layout) {
            updateWidgetLayout(args.id, args.layout);
          }
          return {
            success: true,
            functionName: 'updateDashboardWidget',
            message: `已更新 Widget: ${args.id}`,
          };
        }
        default:
          return {
            success: false,
            functionName: call.name,
            message: `未知的函數: ${call.name}`,
          };
      }
    },
    [
      handleNavigate,
      handleShowCustomerData,
      handleShowQuotation,
      handleShowItinerary,
      setEditMode,
      addWidget,
      removeWidget,
      updateWidgetConfig,
      updateWidgetLayout,
      updateWidgetTitle,
      availableWidgets,
      widgets,
    ]
  );

  /**
   * 執行多個函數呼叫
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
