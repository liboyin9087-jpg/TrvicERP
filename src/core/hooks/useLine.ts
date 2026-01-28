/**
 * Line 訊息發送 Hook
 * Line Messaging Hook
 */

import { useState, useCallback } from 'react';
import { LineService, LineSendTarget, LineSendResult, DocumentSendOptions } from '../services/lineService';

/**
 * Interface for the toast service expected by useLineSend.
 * This decouples the hook from a specific toast implementation (e.g., useToastStore).
 */
export interface LineSendToastService {
  success: (message: string) => void;
  error: (message: (string | { error: string })[]) => void; // Allow more flexible error message, typically array of strings or objects. For simple case string is fine too. Let's simplify back to string to match original behavior.
}
// Refined ToastService to match original behavior more closely:
export interface LineSendToastService {
  success: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Configuration interface for the useLineSend hook.
 * This allows external dependencies (like toast) and custom behaviors to be injected.
 */
export interface UseLineSendConfig {
  /**
   * The toast service to use for displaying notifications.
   * Must provide success and error methods.
   */
  toast: LineSendToastService;
  /**
   * Optional callback for custom error handling.
   * If provided, this will be called in addition to (or instead of) the default error toast.
   * @param error The error object.
   * @param targets The targets or options involved in the failed send operation.
   */
  onSendError?: (error: unknown, targets: LineSendTarget[] | DocumentSendOptions) => void;
}

/**
 * Line 訊息發送 Hook
 *
 * @param config Configuration object for the hook, including toast service and error handlers.
 */
export function useLineSend(config: UseLineSendConfig) {
  const { toast, onSendError } = config;
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<LineSendResult | null>(null);

  /**
   * Helper to display toast notifications based on the result.
   * @param result The result of the Line send operation.
   * @param baseSuccessMessage The base message for successful notifications (e.g., "文字訊息").
   * @param errorMessagePrefix The prefix for error messages (e.g., "文字訊息發送").
   */
  const handleToastNotification = useCallback(
    (result: LineSendResult, baseSuccessMessage: string, errorMessagePrefix: string) => {
      if (result.success) {
        toast.success(`${baseSuccessMessage}已發送至 ${result.sentCount} 位用戶`);
      } else {
        const firstError = result.errors?.[0]?.error;
        toast.error(`${errorMessagePrefix}失敗：${firstError || '未知錯誤'}`);
      }
    },
    [toast]
  );

  /**
   * Helper to create a standardized error result object.
   * @param failedCount The number of targets that failed.
   * @param error The caught error object.
   * @param targetIdentifier An identifier for the failed targets (e.g., 'all').
   * @returns A LineSendResult object representing a failure.
   */
  const createErrorResult = useCallback(
    (failedCount: number, error: unknown, targetIdentifier: string = 'all'): LineSendResult => {
      return {
        success: false,
        sentCount: 0,
        failedCount: failedCount,
        errors: [{ targetId: targetIdentifier, error: String(error) }],
      };
    },
    []
  );

  /**
   * Generic handler for Line send operations.
   * Reduces boilerplate for loading state, result setting, and error handling.
   * @param operation The async function that performs the Line service call.
   * @param baseSuccessMsg The base success message for toast notifications.
   * @param errorMsgPrefix The prefix for error messages in toast notifications.
   * @param initialTargetCount The count of targets/recipients for initial error estimation.
   * @param targetsForError The actual targets/options for the custom error handling callback.
   * @returns The LineSendResult.
   */
  const executeSendOperation = useCallback(
    async (
      operation: () => Promise<LineSendResult>,
      baseSuccessMsg: string,
      errorMsgPrefix: string,
      initialTargetCount: number,
      targetsForError: LineSendTarget[] | DocumentSendOptions
    ): Promise<LineSendResult> => {
      setLoading(true);
      try {
        const result = await operation();
        setLastResult(result);
        handleToastNotification(result, baseSuccessMsg, errorMsgPrefix);
        return result;
      } catch (error) {
        const errorResult = createErrorResult(initialTargetCount, error);
        setLastResult(errorResult);
        handleToastNotification(errorResult, baseSuccessMsg, errorMsgPrefix); // Show generic error toast
        onSendError?.(error, targetsForError); // Call custom error handler if provided
        return errorResult;
      } finally {
        setLoading(false);
      }
    },
    [handleToastNotification, createErrorResult, onSendError]
  );

  const sendText = useCallback(
    async (targets: LineSendTarget[], text: string) => {
      return executeSendOperation(
        () => LineService.sendTextMessage(targets, text),
        `文字訊息`,
        '文字訊息發送',
        targets.length,
        targets
      );
    },
    [executeSendOperation]
  );

  const sendDocument = useCallback(
    async (options: DocumentSendOptions) => {
      return executeSendOperation(
        () => LineService.sendDocumentNotification(options),
        `文件通知`,
        '文件通知發送',
        options.recipients.length,
        options
      );
    },
    [executeSendOperation]
  );

  const sendMeetingReminder = useCallback(
    async (
      targets: LineSendTarget[],
      meetingInfo: Parameters<typeof LineService.sendMeetingReminder>[1]
    ) => {
      return executeSendOperation(
        () => LineService.sendMeetingReminder(targets, meetingInfo),
        `集合提醒`,
        '集合提醒發送',
        targets.length,
        targets
      );
    },
    [executeSendOperation]
  );

  const sendItineraryChange = useCallback(
    async (
      targets: LineSendTarget[],
      change: Parameters<typeof LineService.sendItineraryChangeNotification>[1]
    ) => {
      return executeSendOperation(
        () => LineService.sendItineraryChangeNotification(targets, change),
        `變更通知`,
        '變更通知發送',
        targets.length,
        targets
      );
    },
    [executeSendOperation]
  );

  return {
    loading,
    lastResult,
    sendText,
    sendDocument,
    sendMeetingReminder,
    sendItineraryChange,
  };
}

export default useLineSend;