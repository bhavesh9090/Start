import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8 border border-gray-100">
             <span className="text-5xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-black text-black mb-4 tracking-tighter">System Recovery</h1>
          <p className="text-gray-500 font-bold mb-8 max-w-xs">The application has encountered an issue. Please refresh to continue.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-10 py-4 bg-black text-white font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-[11px]"
          >
            Refresh App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
