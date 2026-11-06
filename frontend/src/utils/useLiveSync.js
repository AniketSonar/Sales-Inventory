import { useEffect } from 'react';

/**
 * useLiveSync
 * Periodically polls the backend every intervalMs so all changes
 * in the live Supabase database sync across tabs and role dashboards in real-time.
 */
export function useLiveSync(callback, intervalMs = 3000) {
  useEffect(() => {
    callback();
    const interval = setInterval(() => {
      callback();
    }, intervalMs);
    return () => clearInterval(interval);
  }, []);
}
