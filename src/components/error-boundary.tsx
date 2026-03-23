'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
          <div className='size-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4'>
            <AlertTriangle className='size-6 text-destructive' />
          </div>
          <h2 className='text-lg font-semibold mb-2'>Something went wrong</h2>
          <p className='text-sm text-muted-foreground mb-6 max-w-sm'>
            {this.state.error?.message ?? 'An unexpected error occurred. Please try again.'}
          </p>
          <Button
            variant='outline'
            className='gap-2'
            onClick={this.reset}
          >
            <RefreshCw className='size-4' />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for simpler usage:
 *
 *   <WithErrorBoundary>
 *     <MyComponent />
 *   </WithErrorBoundary>
 */
export function WithErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}
