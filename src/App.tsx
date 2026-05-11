/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Toaster } from 'sonner';
import { NotificationListener } from './components/NotificationListener';
import { Home } from './pages/Home';
import { Services } from './pages/Services';
import { DesignGallery } from './pages/DesignGallery';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Booking } from './pages/Booking';
import { OrderDetails } from './pages/OrderDetails';
import { Payment } from './pages/Payment';
import { Logout } from './pages/Logout';
import { HomePickup } from './pages/HomePickup';
import { ProtectedRoute } from './components/ProtectedRoute';
import './i18n';

import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

function RootRedirect() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/home" replace />;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Play cinematic splash sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audio.volume = 0.4;
    // Attempt play - browsers may block until user interaction, 
    // but often works if they navigated here from another page or clicked a link
    audio.play().catch(() => {
      // Sliently fail if blocked by browser policy
      console.log('Audio playback inhibited by browser policy');
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        setUserRole(snap.data()?.role || 'customer');
      } else {
        setUserRole(null);
      }
    });

    // Show splash screen for 2.5 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] bg-white flex items-center justify-center overflow-hidden"
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 1,
                  ease: [0.16, 1, 0.3, 1], // Custom cinematic cubic-bezier
                }}
                className="flex flex-col items-center"
              >
                <motion.h1 
                  animate={{ 
                    letterSpacing: ["0.2em", "0.4em"],
                  }}
                  transition={{ duration: 2.5, ease: "linear" }}
                  className="text-4xl md:text-6xl font-serif font-bold text-natural-gold flex items-center gap-4 whitespace-nowrap"
                >
                  TailorHer
                </motion.h1>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.5, duration: 1, ease: "easeInOut" }}
                  className="h-[2px] bg-natural-gold/20 mt-4"
                />
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="mt-6 text-[10px] md:text-xs uppercase tracking-[0.5em] text-natural-text/40 font-bold self-end pr-4"
                >
                  by venkata laxmi
                </motion.p>
              </motion.div>
              
              {/* Netflix-style zoom background elements */}
              <motion.div 
                initial={{ scale: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 2.5, ease: "easeInOut" }}
                className="absolute inset-0 -z-10 bg-natural-pink/5 rounded-full blur-3xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        <Router>
        <div className="min-h-screen bg-white">
          <Toaster position="top-right" expand={true} richColors />
          <NotificationListener />
          <Navbar />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/home" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/designs" element={<DesignGallery />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/booking" element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            } />
            <Route path="/payment" element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            } />
            <Route path="/order-tracking" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/order/:id" element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            } />
            <Route path="/logout" element={<Logout />} />
            <Route path="/home-pickup" element={<HomePickup />} />
          </Routes>
          
          <footer className="bg-natural-subtle py-16 text-natural-text border-t border-natural-gold/10">
            <div className="container mx-auto px-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex flex-col mb-6 group">
                    <h3 className="text-3xl font-serif font-bold text-natural-gold leading-none">TailorHer</h3>
                    <span className="text-xs uppercase tracking-[0.3em] text-natural-text/40 font-bold mt-1 self-end pr-12 transition-colors">by Venkata Laxmi</span>
                  </div>
                  <p className="text-natural-text/60 leading-relaxed max-w-md">
                    A sanctuary of bespoke craftsmanship where traditional elegance meets modern convenience. 
                    Experience the luxury of perfect fits, tailored specifically for you.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold mb-6 uppercase tracking-[0.2em] text-xs text-natural-text/40">Navigation</h4>
                  <ul className="space-y-4 font-medium">
                    <li><Link to="/services" className="hover:text-natural-gold transition-colors">Our Services</Link></li>
                    <li><Link to="/designs" className="hover:text-natural-gold transition-colors">Design Inspirations</Link></li>
                    <li><Link to="/booking" className="hover:text-natural-gold transition-colors">Book Order</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-6 uppercase tracking-[0.2em] text-xs text-natural-text/40">Boutique</h4>
                  <p className="text-natural-text/60 leading-relaxed text-sm">
                    Nookalama Temple Backside<br />
                    S.Suravaram, Tuni<br />
                    <a href="tel:+919440451771" className="mt-2 block font-bold text-natural-text hover:text-natural-gold transition-colors">+91 94404 51771</a>
                  </p>
                </div>
              </div>

              <div className="mt-16 pt-8 border-t border-natural-gold/5 flex flex-col md:flex-row justify-between items-center gap-4 opacity-40 text-xs font-medium">
                <span>© {new Date().getFullYear()} TailorHer by Venkata Laxmi. Modern Craftsmanship.</span>
                <div className="flex gap-6">
                  <a href="#">Privacy Policy</a>
                  <a href="#">Terms of Service</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
      </motion.div>
    </>
  );
}



