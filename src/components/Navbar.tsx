import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Scissors, ShoppingBag, User, LayoutDashboard } from 'lucide-react';
import { LanguageSwitch } from './LanguageSwitch';
import { auth } from '@/src/lib/firebase';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export function Navbar() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const { t } = useTranslation();
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/src/lib/firebase');
        const snap = await getDoc(doc(db, 'users', u.uid));
        const data = snap.data();
        const role = (data?.role === 'tailor' || data?.role === 'admin' || u.email === 'mekalamanojkumar6@gmail.com') ? 'tailor' : 'customer';
        setUserRole(role);
      } else {
        setUserRole(null);
      }
    });
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white/50 backdrop-blur-md border-b border-natural-gold/20 px-10 py-4 flex items-center justify-between">
      <Link to={userRole === 'tailor' ? "/dashboard" : "/home"} className="flex items-center gap-1 group">
        <div className="w-10 h-10 bg-natural-gold rounded-full flex items-center justify-center text-white font-serif text-2xl font-bold shadow-sm group-hover:scale-105 transition-transform">
          T
        </div>
        <div className="flex flex-col leading-none ml-1">
          <span className="text-xl md:text-2xl font-serif font-bold text-natural-gold tracking-tighter">TailorHer</span>
          <span className="text-[8px] md:text-[10px] uppercase tracking-[0.1em] text-natural-text/40 font-bold self-end pr-1 transition-all group-hover:text-natural-gold/60">by Venkata Laxmi</span>
        </div>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {userRole !== 'tailor' && (
          <Link to="/services" className="text-natural-text/70 hover:text-natural-gold font-medium transition-colors">{t('nav.services')}</Link>
        )}
        {userRole !== 'tailor' && (
          <Link to="/designs" className="text-natural-text/70 hover:text-natural-gold font-medium transition-colors">{t('nav.gallery')}</Link>
        )}
        <Link to="/home-pickup" className="text-natural-gold/80 hover:text-natural-gold font-bold transition-colors">Home Pickup</Link>
        <Link to="/order-tracking" className="text-natural-text/70 hover:text-natural-gold font-medium transition-colors">{t('nav.orders')}</Link>
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitch />
        
        {user ? (
          <div className="flex items-center gap-3">
            <Link 
              to="/dashboard" 
              className="w-10 h-10 bg-natural-text rounded-full flex items-center justify-center text-white hover:bg-natural-text/90 transition-colors shadow-md group"
              title="Dashboard"
            >
              <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Link>
            <Link 
              to="/logout" 
              className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-natural-text/40 hover:text-red-500 transition-colors"
            >
              Logout
            </Link>
          </div>
        ) : (
          <Link 
            to="/login" 
            className="flex items-center gap-2 px-6 py-2.5 bg-natural-text text-white rounded-full font-medium hover:bg-natural-text/90 transition-all shadow-md active:scale-95"
          >
            <User className="w-4 h-4" />
            <span>{t('auth.login')}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
