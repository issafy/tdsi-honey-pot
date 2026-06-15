import { Component } from 'react';
import { createLogger } from '../utils/logger';

const log = createLogger('error-boundary');

/**
 * Error boundary that catches Three.js/WebGL crashes and shows a fallback.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    log.error('Caught rendering error', error.message);
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center w-full h-full bg-gray-950 text-gray-400 font-mono text-sm">
          <div className="text-center p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="font-bold text-white mb-2">WebGL Rendering Error</p>
            <p className="text-xs text-gray-500 max-w-md">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
