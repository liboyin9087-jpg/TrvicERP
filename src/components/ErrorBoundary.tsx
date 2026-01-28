import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // 呼叫自訂錯誤處理
    this.props.onError?.(error, errorInfo);

    // 記錄錯誤到 console（生產環境可改為發送到錯誤追蹤服務）
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // 可在此發送錯誤到 Sentry 或其他錯誤追蹤服務
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果有自訂 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 預設錯誤畫面
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-red-500 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              系統發生錯誤
            </h2>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              很抱歉，系統遇到了一些問題。請嘗試重新整理頁面或聯繫技術支援。
            </p>

            {/* 開發環境顯示錯誤詳情 */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-300">
                  錯誤詳情
                </summary>
                <div className="mt-2 text-sm font-mono text-red-600 dark:text-red-400 overflow-auto max-h-40">
                  <p className="font-bold">{this.state.error.name}:</p>
                  <p>{this.state.error.message}</p>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="mt-2 text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
              >
                重試
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
              >
                重新整理頁面
              </button>
            </div>

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              錯誤代碼: {this.state.error?.name || 'UNKNOWN'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * HOC 版本的 Error Boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * 區塊級 Error Boundary（較小的 UI 區塊使用）
 */
export function SectionErrorBoundary({
  children,
  sectionName = '此區塊',
}: {
  children: ReactNode;
  sectionName?: string;
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">
            {sectionName}載入失敗，請重新整理頁面
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}