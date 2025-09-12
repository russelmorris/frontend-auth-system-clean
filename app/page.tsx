"use client"

import { useEffect } from 'react';

export default function Home() {
  // Redirect to dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Dashboard...</h1>
        <p className="text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}