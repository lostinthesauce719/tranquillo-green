// Declares its own boundary rather than relying on a parent page to do it —
// this component uses useState/useEffect/useCallback and useAuth.
"use client";

import { useState, useEffect, useCallback } from 'react';
// useAuth() returns { userId, sessionId, getToken } and has no `user` property.
// useUser() is the hook that exposes the user object.
import { useUser } from '@clerk/nextjs';
import { useMetrcSync } from '@/lib/metrc/useMetrcSync';
import { formatDistanceToNow } from 'date-fns';

const MetrcSync = () => {
  const { user } = useUser();
  const { 
    status, 
    lastSync, 
    logs, 
    syncNow, 
    errors, 
    retrySync, 
    isSyncing,
    stats 
  } = useMetrcSync();
  
  const [selectedTab, setSelectedTab] = useState<'status' | 'logs' | 'errors'>('status');
  
  // Refresh sync status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // The hook will update automatically
    }, 30000);
    
    return () => clearInterval(interval);
  }, [status]);
  
  const handleSyncNow = useCallback(async () => {
    await syncNow();
  }, [syncNow]);
  
  const getStatusClass = (value: string) => {
    switch(value.toLowerCase()) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'syncing': return 'bg-blue-500';
      default: return 'bg-gray-300';
    }
  };
  
  if (!user) {
    return <div className="p-6">Please log in to view METRC sync status.</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-6">
          METRC Sync Status
        </h2>
        
        {/* Status Summary Card */}
        <div className="bg-white shadow-lg rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold mb-2">Sync Status</h3>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(status)}`}>
                  {status}
                </span>
                {lastSync && (
                  <span className="text-gray-600">
                    Last sync: {formatDistanceToNow(new Date(lastSync))} ago
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className={`px-6 py-2 rounded-lg font-medium ${
                  isSyncing 
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
          
          {stats && (
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.facilities}</div>
                <div className="text-sm text-gray-600">Facilities</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.strains}</div>
                <div className="text-sm text-gray-600">Strains</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.packages}</div>
                <div className="text-sm text-gray-600">Packages</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Tabs Navigation */}
        <div className="bg-gray-200 rounded-lg p-2 flex space-x-2 mb-6">
          <button
            onClick={() => setSelectedTab('status')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedTab === 'status' 
                ? 'bg-white text-blue-600' 
                : 'text-gray-600 hover:bg-gray-300'
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setSelectedTab('logs')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedTab === 'logs' 
                ? 'bg-white text-blue-600' 
                : 'text-gray-600 hover:bg-gray-300'
            }`}
          >
            Logs
          </button>
          <button
            onClick={() => setSelectedTab('errors')}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedTab === 'errors' 
                ? 'bg-white text-blue-600' 
                : 'text-gray-600 hover:bg-gray-300'
            }`}
          >
            Errors
          </button>
        </div>
        
        {/* Content Area */}
        <div className="bg-white shadow-lg rounded-2xl p-6 min-h-[400px]">
          {selectedTab === 'status' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Sync Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">Current Status</span>
                  {/* Compared against 'Success'/'Error' (capitalised), but the
                      hook emits 'idle' | 'syncing' | 'success' | 'error', so
                      neither branch could ever match and the status was always
                      rendered blue. */}
                  <span className={`font-medium ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
                    {status}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">Last Successful Sync</span>
                  <span className="text-gray-800">
                    {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">Next Scheduled Sync</span>
                  <span className="text-gray-800">Every 5 minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Sync Duration</span>
                  <span className="text-gray-800">{stats?.duration ? `${stats.duration} seconds` : 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
          
          {selectedTab === 'logs' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Sync Logs</h3>
              <div className="bg-gray-50 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="text-gray-500">No logs available</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className={`mb-2 ${log.level === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
                      <span className="text-gray-400">{[log.timestamp]}</span> <span className="font-medium">{log.level}:</span> {log.message}
                      {log.details && <div className="ml-4 mt-1 text-gray-500">{JSON.stringify(log.details)}</div>}
                    </div>
                  )).reverse()
                )}
              </div>
            </div>
          )}
          
          {selectedTab === 'errors' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Sync Errors</h3>
              {errors.length === 0 ? (
                <div className="text-green-600 text-center py-8">No errors in the last 24 hours</div>
              ) : (
                <div className="space-y-4">
                  {errors.map((error, index) => (
                    <div key={index} className="border-l-4 rounded-r bg-gray-50 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-red-600">{error.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{error.message}</p>
                          {error.details && (
                            <pre className="mt-2 text-xs text-gray-500 overflow-x-auto bg-white p-2 rounded">{JSON.stringify(error.details, null, 2)}</pre>
                          )}
                        </div>
                        <button
                          onClick={() => retrySync(error.id)}
                          className="ml-4 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded"
                        >
                          Retry
                        </button>
                      </div>
                      <div className="text-gray-400 text-xs mt-2">
                        Occurred: {formatDistanceToNow(new Date(error.timestamp))} ago
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetrcSync;
