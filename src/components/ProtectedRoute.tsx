import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '@/src/lib/firebase';
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
}
