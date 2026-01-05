import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Error Header */}
            <div className="bg-rose-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
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
                <div>
                  <h1 className="text-2xl font-bold">應用程式發生錯誤</h1>
                  <p className="text-rose-100 text-sm mt-1">
                    Application Error
                  </p>
                </div>
              </div>
            </div>

            {/* Error Content */}
            <div className="p-6 space-y-4">
              <p className="text-slate-600">
                很抱歉，應用程式遇到了意外錯誤。請嘗試重新載入頁面。
              </p>
              <p className="text-slate-500 text-sm" lang="en">
                We're sorry, the application encountered an unexpected error.
                Please try reloading the page.
              </p>

              {/* Error Details (Development Mode) */}
              {process.env.NODE_ENV === 'development' && import.meta.env.DEV && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                    錯誤詳情 (開發模式)
                  </summary>
                  <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 overflow-auto">
                    <p className="text-xs font-mono text-rose-600 mb-2">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  重新載入頁面
                </button>
                <button
                  onClick={this.handleReset}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  返回應用
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
