/**
 * Line 訊息發送 Hook
 * Line Messaging Hook
 */

import { useState, useCallback } from 'react';
import { LineService, LineSendTarget, LineSendResult, DocumentSendOptions } from '../services/lineService';
import { useToast } from '../../store/useToastStore';

/**
 * Line 訊息發送 Hook
 */
export function useLineSend() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<LineSendResult | null>(null);
  const toast = useToast();

  const sendText = useCallback(
    async (targets: LineSendTarget[], text: string) => {
      setLoading(true);
      try {
        const result = await LineService.sendTextMessage(targets, text);
        setLastResult(result);

        if (result.success) {
          toast.success(`已發送至 ${result.sentCount} 位用戶`);
        } else {
          toast.error(`發送失敗：${result.errors?.[0]?.error || '未知錯誤'}`);
        }

        return result;
      } catch (error) {
        const errorResult: LineSendResult = {
          success: false,
          sentCount: 0,
          failedCount: targets.length,
          errors: [{ targetId: 'all', error: String(error) }],
        };
        setLastResult(errorResult);
        toast.error('發送失敗');
        return errorResult;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const sendDocument = useCallback(
    async (options: DocumentSendOptions) => {
      setLoading(true);
      try {
        const result = await LineService.sendDocumentNotification(options);
        setLastResult(result);

        if (result.success) {
          toast.success(`文件通知已發送至 ${result.sentCount} 位用戶`);
        } else {
          toast.error(`發送失敗：${result.errors?.[0]?.error || '未知錯誤'}`);
        }

        return result;
      } catch (error) {
        const errorResult: LineSendResult = {
          success: false,
          sentCount: 0,
          failedCount: options.recipients.length,
          errors: [{ targetId: 'all', error: String(error) }],
        };
        setLastResult(errorResult);
        toast.error('發送失敗');
        return errorResult;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const sendMeetingReminder = useCallback(
    async (
      targets: LineSendTarget[],
      meetingInfo: Parameters<typeof LineService.sendMeetingReminder>[1]
    ) => {
      setLoading(true);
      try {
        const result = await LineService.sendMeetingReminder(targets, meetingInfo);
        setLastResult(result);

        if (result.success) {
          toast.success(`集合提醒已發送至 ${result.sentCount} 位用戶`);
        } else {
          toast.error(`發送失敗：${result.errors?.[0]?.error || '未知錯誤'}`);
        }

        return result;
      } catch (error) {
        const errorResult: LineSendResult = {
          success: false,
          sentCount: 0,
          failedCount: targets.length,
          errors: [{ targetId: 'all', error: String(error) }],
        };
        setLastResult(errorResult);
        toast.error('發送失敗');
        return errorResult;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const sendItineraryChange = useCallback(
    async (
      targets: LineSendTarget[],
      change: Parameters<typeof LineService.sendItineraryChangeNotification>[1]
    ) => {
      setLoading(true);
      try {
        const result = await LineService.sendItineraryChangeNotification(targets, change);
        setLastResult(result);

        if (result.success) {
          toast.success(`變更通知已發送至 ${result.sentCount} 位用戶`);
        } else {
          toast.error(`發送失敗：${result.errors?.[0]?.error || '未知錯誤'}`);
        }

        return result;
      } catch (error) {
        const errorResult: LineSendResult = {
          success: false,
          sentCount: 0,
          failedCount: targets.length,
          errors: [{ targetId: 'all', error: String(error) }],
        };
        setLastResult(errorResult);
        toast.error('發送失敗');
        return errorResult;
      } finally {
        setLoading(false);
      }
    },
    [toast]
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
