import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; errorInfo: React.ErrorInfo; onRetry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
          />
        );
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h3>Something went wrong</h3>
            <p>A component error occurred. Please try refreshing the page.</p>
            <details className="error-details">
              <summary>Error Details (for developers)</summary>
              <pre className="error-stack">
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
            <div className="error-actions">
              <button onClick={this.handleRetry} className="retry-button">
                Try Again
              </button>
              <button onClick={() => window.location.reload()} className="refresh-button">
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}