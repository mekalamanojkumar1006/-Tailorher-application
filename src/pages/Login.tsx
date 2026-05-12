import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/src/lib/firebase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const role = user.email === 'mekalamanojkumar6@gmail.com' ? 'tailor' : 'customer';
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || 'Customer',
          email: user.email,
          role: role,
          teluguEnabled: false,
          createdAt: serverTimestamp()
        });
      }
      const from = location.state?.from?.pathname || '/dashboard';
      const search = location.state?.from?.search || '';
      navigate(from + search, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const from = location.state?.from?.pathname || '/dashboard';
      const search = location.state?.from?.search || '';
      navigate(from + search, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-natural-subtle px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-natural-gold/10 p-10 md:p-12">
        <div className="text-center mb-10 group">
          <div className="flex flex-col items-center mb-4">
            <h2 className="text-4xl font-serif font-bold text-natural-gold leading-none tracking-tighter transition-transform group-hover:scale-105">TailorHer</h2>
            <span className="text-[10px] uppercase tracking-[0.2em] text-natural-text/40 font-bold self-end pr-12 mt-1">by Venkata Laxmi</span>
          </div>
          <p className="text-natural-text/60 mt-4">{t('auth.login')}</p>
        </div>

        {error && <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
        {message && <div className="mb-6 p-3 bg-green-50 text-green-600 rounded-xl text-sm border border-green-100">{message}</div>}

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-natural-text mb-2 text-xs font-bold uppercase tracking-widest text-natural-text/40">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 rounded-xl border border-natural-gold/10 focus:outline-none focus:ring-4 focus:ring-natural-gold/5 transition-all text-natural-text font-medium bg-natural-subtle/30"
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-widest text-natural-text/40">Password</label>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-xs font-bold text-natural-gold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-xl border border-natural-gold/10 focus:outline-none focus:ring-4 focus:ring-natural-gold/5 transition-all text-natural-text font-medium bg-natural-subtle/30"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-natural-gold text-white rounded-xl font-bold hover:bg-natural-gold/90 transition-all shadow-xl shadow-natural-gold/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn className="w-5 h-5" />}
            <span className="uppercase tracking-widest text-sm">Sign In</span>
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-natural-gold/10"></div></div>
          <div className="relative flex justify-center text-sm uppercase"><span className="px-2 bg-white text-natural-text/40 font-bold tracking-widest text-[10px]">Or continue with</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 bg-white border border-natural-gold/10 text-natural-text rounded-xl font-medium hover:bg-natural-bg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          <span className="uppercase tracking-widest text-xs">Google Account</span>
        </button>

        <p className="mt-8 text-center text-natural-text/60 text-sm">
          Don't have an account? <Link to="/register" state={{ from: location.state?.from }} className="text-natural-peach font-bold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
