import React, { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Home, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Logout error:", err);
      }
    };
    performLogout();
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-natural-subtle px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-natural-gold/10 p-12 text-center"
      >
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-natural-gold/10 rounded-full flex items-center justify-center text-natural-gold">
            <LogOut className="w-10 h-10" />
          </div>
        </div>
        
        <h1 className="text-3xl font-serif font-bold text-natural-text mb-4">Logged Out</h1>
        <p className="text-natural-text/60 mb-10 leading-relaxed">
          You have been safely signed out of your TailorHer account. 
          We hope to see you back soon!
        </p>

        <div className="grid grid-cols-1 gap-4">
          <Link 
            to="/" 
            className="flex items-center justify-center gap-3 py-4 bg-natural-gold text-white rounded-2xl font-bold hover:bg-natural-gold/90 transition-all shadow-xl shadow-natural-gold/20 active:scale-95"
          >
            <Home className="w-5 h-5" />
            <span className="uppercase tracking-widest text-sm">Go to Home</span>
          </Link>
          
          <Link 
            to="/login" 
            className="flex items-center justify-center gap-3 py-4 border-2 border-natural-gold/10 text-natural-gold rounded-2xl font-bold hover:border-natural-gold transition-all active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            <span className="uppercase tracking-widest text-sm">Sign In Again</span>
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-natural-gold/5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-natural-text/30 font-bold">
            TailorHer by Venkata Laxmi
          </p>
        </div>
      </motion.div>
    </div>
  );
}
