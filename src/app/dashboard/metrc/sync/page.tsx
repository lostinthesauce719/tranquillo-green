"use client";

// Path was '../../components/metrc/MetrcSync', which resolves to
// src/app/dashboard/components/metrc/ — a directory that does not exist.
// The component lives at src/components/metrc/MetrcSync.tsx.
import MetrcSync from '@/components/metrc/MetrcSync';

export default function MetrcSyncPage() {

  return (
    <main className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          METRC Integration
        </h1>
        
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <MetrcSync />
        </div>
        
        {/* Additional info could go here */}
      </div>
    </main>
  );
}
