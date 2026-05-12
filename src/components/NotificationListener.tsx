import React, { useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { toast } from 'sonner';
import { PackageOpen, Bell } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';

// Simple hook to check if user is tailor
const useIsTailor = () => {
  const [user] = useAuthState(auth);
  const [isTailor, setIsTailor] = React.useState(false);

  useEffect(() => {
    if (!user) {
      setIsTailor(false);
      return;
    }
    
    // Tailor check logic consistent with Dashboard.tsx and OrderDetails.tsx
    // (In a real app this would be a field on the user document)
    const checkRole = async () => {
      if (user.email === 'mekalamanojkumar6@gmail.com') {
        setIsTailor(true);
        return;
      }
      
      try {
        const { getDoc, doc } = await import('firebase/firestore');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const data = userDoc.data();
        if (data?.role === 'tailor' || data?.role === 'admin') {
          setIsTailor(true);
        }
      } catch (err) {
        console.error("Error checking role:", err);
      }
    };
    
    checkRole();
  }, [user]);

  return isTailor;
};

export function NotificationListener() {
  const isTailor = useIsTailor();

  useEffect(() => {
    if (!isTailor) return;

    // Only listen for orders created after the current session started
    const startTime = Timestamp.now();
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>', startTime)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = change.doc.data();
          // Avoid triggering for the tailor's own actions if they create something (not likely here)
          
          toast('New Order Received!', {
            description: `${order.serviceId || 'Bespoke Item'} order from ${order.customerName || 'a customer'}.`,
            icon: <PackageOpen className="w-5 h-5 text-natural-gold" />,
            action: {
              label: 'View Order',
              onClick: () => window.location.href = `/order/${change.doc.id}`
            },
            duration: 8000
          });

          // Play a subtle sound if possible (optional, but requested "real-time notification")
          // Basic browser beep or something could be too much, sonner toast is good.
        }
      });
    }, (err) => {
      if (auth.currentUser) {
        console.error("NotificationListener error:", err);
      }
    });

    return () => unsubscribe();
  }, [isTailor]);

  return null;
}
