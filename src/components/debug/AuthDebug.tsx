'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function AuthDebug() {
  try {
    const { user, loading } = useAuth();
    
    return (
      <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs z-50">
        <div>Auth Status: {loading ? 'Loading...' : user ? 'Authenticated' : 'Not authenticated'}</div>
        {user && <div>User: {user.displayName || user.email || user.phoneNumber}</div>}
      </div>
    );
  } catch (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded text-xs z-50">
        Auth Error: {(error as Error).message}
      </div>
    );
  }
}