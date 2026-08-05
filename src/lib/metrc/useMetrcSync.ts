"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
// Was `import { useAuth } from '@/lib/clerk/AuthBoundary'` — a module that does
// not exist anywhere in this repo, so this file has never compiled. Clerk's
// useAuth() returns { userId, sessionId, getToken }; the hook that exposes a
// `user` object with `.id` is useUser().
import { useUser } from '@clerk/nextjs';
import { MetrcClient } from '@/lib/metrc/metrcClient';
import { formatDistanceToNow } from 'date-fns';

// Exported both ways: MetrcSync.tsx imports it as a named export, while the
// default export at the bottom of this file is kept for existing callers.
export const useMetrcSync = () => {
  const { user } = useUser();
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const metrcClientRef = useRef<MetrcClient | null>(null);
  const errorIdCounter = useRef(1);
  
  // Initialize METRC client
  useEffect(() => {
    if (user?.id) {
      metrcClientRef.current = new MetrcClient({
        userId: user.id,
      });
    }
    return () => {
      metrcClientRef.current = null;
    };
  }, [user]);
  
  // Add log function
  const addLog = useCallback((log: any) => {
    setLogs(prev => [...prev, log].slice(0, 100)); // Keep last 100 logs
  }, []);
  
  // Add error function
  const addError = useCallback((error: any) => {
    setErrors(prev => [{ id: `error_${errorIdCounter.current++}`, ...error }, ...prev].slice(0, 50)); // Keep last 50 errors
  }, []);
  
  // Sync logic
  const performSync = useCallback(async () => {
    if (!metrcClientRef.current || !user) return;
    
    setIsSyncing(true);
    setStatus('syncing');
    addLog({ level: 'info', message: 'Starting METRC sync...' });
    
    try {
      const startTime = Date.now();
      
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const duration = Date.now() - startTime;
      const syncTime = new Date().toISOString();
      
      setStatus('success');
      setLastSync(syncTime);
      addLog({ level: 'info', message: 'METRC sync completed successfully', details: { duration: `${duration}ms` } });
      
      // Update stats (mock data for now)
      setStats({
        facilities: 3,
        strains: 142,
        packages: 8743,
        duration,
        lastSync: syncTime
      });
      
    } catch (error: any) {
      setStatus('error');
      addLog({ level: 'error', message: 'Sync failed', details: { error: error.message } });
      addError({
        title: 'Sync Failed',
        message: error.message || 'Unknown error occurred during sync',
        details: { error }
      });
    } finally {
      setIsSyncing(false);
    }
  }, [user, addLog, addError]);
  
  // Automatic sync every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (status !== 'error' && user) {
        performSync();
      }
    }, 300000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [status, user, performSync]);
  
  // Initial sync on mount if user is logged in
  useEffect(() => {
    if (user) {
      performSync();
    }
  }, [user, performSync]);
  
  // Retry specific error
  const retrySync = useCallback(async (errorId: string) => {
    const errorToRetry = errors.find(err => err.id === errorId);
    if (!errorToRetry || !metrcClientRef.current) return;
    
    addLog({ level: 'info', message: `Retrying sync for error ${errorId}` });
    
    try {
      // Update retry count
      setErrors(prev => prev.map(err => 
        err.id === errorId ? { ...err, retryCount: err.retryCount + 1 } : err
      ));
      
      // Simulate retry
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // If successful, remove the error
      setErrors(prev => prev.filter(err => err.id !== errorId));
      addLog({ level: 'info', message: `Error ${errorId} resolved successfully` });
      
      // Trigger a full sync to ensure consistency
      performSync();
      
    } catch (error: any) {
      addLog({ level: 'error', message: `Retry failed for error ${errorId}`, details: { error } });
    }
  }, [errors, addLog, performSync]);
  
  return {
    status,
    lastSync,
    logs,
    syncNow: performSync,
    errors,
    retrySync,
    isSyncing,
    stats
  };
};

export default useMetrcSync;
