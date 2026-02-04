import * as Sentry from "@sentry/react";

export function initSentry() {
  // Only initialize Sentry in production
  if (import.meta.env.PROD) {
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    
    if (sentryDsn) {
      Sentry.init({
        dsn: sentryDsn,
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ],
        // Performance Monitoring
        tracesSampleRate: 1.0, // Capture 100% of transactions in production
        // Session Replay
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
        
        // Set environment
        environment: import.meta.env.MODE,
        
        // Release tracking (optional)
        // release: import.meta.env.VITE_APP_VERSION,
        
        // Filter out sensitive data
        beforeSend(event) {
          // Remove sensitive data from event
          if (event.request) {
            delete event.request.cookies;
            delete event.request.headers;
          }
          return event;
        },
      });

      // Make Sentry available globally for ErrorBoundary
      window.Sentry = Sentry;
      
      console.log("[Sentry] Initialized successfully");
    } else {
      console.warn("[Sentry] DSN not configured. Set VITE_SENTRY_DSN environment variable.");
    }
  } else {
    console.log("[Sentry] Skipped in development mode");
  }
}

// Export Sentry for manual error reporting
export { Sentry };
