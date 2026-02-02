/**
 * Connection Diagnostics Utility
 * 用於檢查 Vercel 部署後的各項服務連線狀態
 */

import { supabase, isSupabaseConfigured } from './supabase';

export interface ConnectionStatus {
  service: string;
  status: 'ok' | 'error' | 'not_configured';
  message: string;
  details?: string;
}

export interface DiagnosticsResult {
  timestamp: string;
  environment: string;
  useMock: boolean;
  connections: ConnectionStatus[];
  summary: {
    total: number;
    ok: number;
    errors: number;
    notConfigured: number;
  };
}

/**
 * 檢查 Supabase 連線狀態
 */
async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      service: 'Supabase',
      status: 'not_configured',
      message: '環境變數未設定',
      details: `VITE_SUPABASE_URL: ${url ? '已設定' : '未設定'}, VITE_SUPABASE_ANON_KEY: ${key ? '已設定' : '未設定'}`,
    };
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      service: 'Supabase',
      status: 'error',
      message: 'Supabase Client 初始化失敗',
      details: 'Client 未能正確建立',
    };
  }

  try {
    // 嘗試取得 session 來驗證連線
    const { error } = await supabase.auth.getSession();
    if (error) {
      return {
        service: 'Supabase',
        status: 'error',
        message: '連線錯誤',
        details: error.message,
      };
    }
    return {
      service: 'Supabase',
      status: 'ok',
      message: '連線正常',
      details: `URL: ${url.substring(0, 30)}...`,
    };
  } catch (err) {
    return {
      service: 'Supabase',
      status: 'error',
      message: '連線失敗',
      details: err instanceof Error ? err.message : '未知錯誤',
    };
  }
}

/**
 * 檢查 API 連線狀態
 */
async function checkApiConnection(): Promise<ConnectionStatus> {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    return {
      service: 'Backend API',
      status: 'not_configured',
      message: 'VITE_API_URL 未設定',
    };
  }

  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      return {
        service: 'Backend API',
        status: 'ok',
        message: '連線正常',
        details: `URL: ${apiUrl}`,
      };
    }

    return {
      service: 'Backend API',
      status: 'error',
      message: `HTTP ${response.status}`,
      details: response.statusText,
    };
  } catch (err) {
    return {
      service: 'Backend API',
      status: 'error',
      message: '無法連線',
      details: err instanceof Error ? err.message : '請確認後端服務是否已啟動',
    };
  }
}

/**
 * 檢查 WebSocket 連線狀態
 */
async function checkWebSocketConnection(): Promise<ConnectionStatus> {
  const wsUrl = import.meta.env.VITE_WS_URL;

  if (!wsUrl) {
    return {
      service: 'WebSocket',
      status: 'not_configured',
      message: 'VITE_WS_URL 未設定',
    };
  }

  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(wsUrl);
      const timeout = setTimeout(() => {
        ws.close();
        resolve({
          service: 'WebSocket',
          status: 'error',
          message: '連線逾時',
          details: `URL: ${wsUrl}`,
        });
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve({
          service: 'WebSocket',
          status: 'ok',
          message: '連線正常',
          details: `URL: ${wsUrl}`,
        });
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        ws.close();
        resolve({
          service: 'WebSocket',
          status: 'error',
          message: '連線失敗',
          details: `URL: ${wsUrl}`,
        });
      };
    } catch (err) {
      resolve({
        service: 'WebSocket',
        status: 'error',
        message: '建立連線時發生錯誤',
        details: err instanceof Error ? err.message : '未知錯誤',
      });
    }
  });
}

/**
 * 執行完整的連線診斷
 */
export async function runDiagnostics(): Promise<DiagnosticsResult> {
  const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
  const connections: ConnectionStatus[] = [];

  // 檢查各服務連線
  connections.push(await checkSupabaseConnection());
  
  // 如果不是 Mock 模式，也檢查 API 和 WebSocket
  if (!useMock) {
    connections.push(await checkApiConnection());
    connections.push(await checkWebSocketConnection());
  }

  // 計算統計
  const summary = {
    total: connections.length,
    ok: connections.filter((c) => c.status === 'ok').length,
    errors: connections.filter((c) => c.status === 'error').length,
    notConfigured: connections.filter((c) => c.status === 'not_configured').length,
  };

  return {
    timestamp: new Date().toISOString(),
    environment: import.meta.env.MODE,
    useMock,
    connections,
    summary,
  };
}

/**
 * 在 Console 輸出診斷結果
 */
export async function logDiagnostics(): Promise<void> {
  const result = await runDiagnostics();
  
  console.group('🔍 TrvicERP Connection Diagnostics');
  console.log('Timestamp:', result.timestamp);
  console.log('Environment:', result.environment);
  console.log('Mock Mode:', result.useMock ? '✅ Enabled' : '❌ Disabled');
  
  console.group('Connections:');
  for (const conn of result.connections) {
    const icon = conn.status === 'ok' ? '✅' : conn.status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${conn.service}: ${conn.message}`);
    if (conn.details) {
      console.log(`   └─ ${conn.details}`);
    }
  }
  console.groupEnd();
  
  console.log(`Summary: ${result.summary.ok}/${result.summary.total} services OK`);
  console.groupEnd();
}

/**
 * 在開發模式或啟用 DEBUG_CONNECTION 時自動執行診斷
 */
if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_CONNECTION === 'true') {
  // 延遲執行以確保頁面已載入
  setTimeout(() => {
    logDiagnostics().catch(console.error);
  }, 1000);
}
