import { useState, useCallback } from 'react';
import { LineService, LineSendTarget, LineSendResult, DocumentSendOptions } from '../services/lineService';
import { useToast } from '../../store/useToastStore';

type MeetingInfo = Parameters<typeof LineService.sendMeetingReminder>[1];
type ItineraryChange = Parameters<typeof LineService.sendItineraryChangeNotification>[1];

export function useLineSend() {
  const [loading, setLoading] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<LineSendResult | null>(null);
  const toast = useToast();

  const sendText = useCallback(
    async (targets: LineSendTarget[], text: string): Promise<LineSendResult> => {
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
          errors: [{ targetId: 'all', error: error instanceof Error ? error.message : String(error) }],
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
    async (options: DocumentSendOptions): Promise<LineSendResult> => {
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
          errors: [{ targetId: 'all', error: error instanceof Error ? error.message : String(error) }],
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
    async (targets: LineSendTarget[], meetingInfo: MeetingInfo): Promise<LineSendResult> => {
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
          errors: [{ targetId: 'all', error: error instanceof Error ? error.message : String(error) }],
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
    async (targets: LineSendTarget[], change: ItineraryChange): Promise<LineSendResult> => {
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
          errors: [{ targetId: 'all', error: error instanceof Error ? error.message : String(error) }],
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