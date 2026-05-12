import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '@/src/lib/firebase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { UserPlus, User, Scissors, Mail } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'customer' | 'tailor'>('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const validateTailorEmail = (email: string) => {
    const pattern = /^tailorher[1-5]@gmail\.com$/i;
    return pattern.test(email);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (role === 'tailor' && !validateTailorEmail(email)) {
      setError('Tailor accounts can only use emails from tailorher1@gmail.com to tailorher5@gmail.com');
      setLoading(false);
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      await updateProfile(user, { displayName });
      
      if (role !== 'tailor') {
        await sendEmailVerification(user);
      }

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName,
        email,
        role,
        teluguEnabled: false,
        createdAt: serverTimestamp()
      });

      if (role === 'tailor') {
        const from = location.state?.from?.pathname || '/dashboard';
        const search = location.state?.from?.search || '';
        navigate(from + search, { replace: true });
      } else {
        setVerificationSent(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return;
    setResending(true);
    setResendMessage('');
    try {
      await sendEmailVerification(auth.currentUser);
      setResendMessage('Verification link resent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center bg-natural-subtle px-6 py-12">
        <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl border border-natural-gold/10 p-12 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <Mail className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-natural-text mb-4">Verify Your Email</h2>
          <p className="text-natural-text/60 mb-8 leading-relaxed">
            We've sent a verification link to <span className="font-bold text-natural-text">{email}</span>. 
            Please check your inbox and verify your account to continue.
          </p>
          
          {resendMessage && <div className="mb-6 p-3 bg-green-50 text-green-600 rounded-xl text-sm border border-green-100">{resendMessage}</div>}
          {error && <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}

          <div className="space-y-4">
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-4 bg-natural-gold text-white rounded-xl font-bold hover:bg-natural-gold/90 transition-all shadow-xl shadow-natural-gold/10 uppercase tracking-widest text-sm"
            >
              Go to Login
            </button>
            <button 
              onClick={resendVerification}
              disabled={resending}
              className="text-sm font-bold text-natural-gold hover:underline disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Did not get the email? Resend link'}
            </button>
            <p className="text-sm text-natural-text/40 pt-4 border-t border-natural-gold/5">
              Check your spam folder if you don't see it within a few minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-natural-subtle px-6 py-12">
      <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl border border-natural-gold/10 p-10 md:p-12">
        <div className="text-center mb-10 group">
          <div className="flex flex-col items-center mb-4">
            <h2 className="text-4xl font-serif font-bold text-natural-gold leading-none tracking-tighter">TailorHer</h2>
            <span className="text-[10px] uppercase tracking-[0.2em] text-natural-text/40 font-bold self-end pr-16 mt-1">by Venkata Laxmi</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-natural-text mt-6">Create Account</h1>
          <p className="text-natural-text/60 mt-2">Join our bespoke tailoring community</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 font-medium">{error}</div>}

        <div className="grid grid-cols-2 gap-4 mb-10">
          <button
            onClick={() => setRole('customer')}
            className={cn(
              "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all group",
              role === 'customer' 
                ? "border-natural-gold bg-natural-gold text-white shadow-xl shadow-natural-gold/20" 
                : "border-natural-gold/10 hover:border-natural-gold/30 text-natural-text hover:bg-natural-subtle"
            )}
          >
            <User className={cn("w-6 h-6", role === 'customer' ? "text-white" : "text-natural-gold")} />
            <span className="font-bold text-sm uppercase tracking-widest">Customer</span>
          </button>
          <button
            onClick={() => setRole('tailor')}
            className={cn(
              "flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all group",
              role === 'tailor' 
                ? "border-natural-gold bg-natural-gold text-white shadow-xl shadow-natural-gold/20" 
                : "border-natural-gold/10 hover:border-natural-gold/30 text-natural-text hover:bg-natural-subtle"
            )}
          >
            <Scissors className={cn("w-6 h-6", role === 'tailor' ? "text-white" : "text-natural-gold")} />
            <span className="font-bold text-sm uppercase tracking-widest">Tailor</span>
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-natural-text/40 uppercase tracking-widest mb-2 ml-1">Full Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-natural-gold/10 focus:outline-none focus:ring-4 focus:ring-natural-gold/5 transition-all text-natural-text font-medium bg-natural-subtle/30"
              placeholder="Venkata Laxmi"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-natural-text/40 uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-natural-gold/10 focus:outline-none focus:ring-4 focus:ring-natural-gold/5 transition-all text-natural-text font-medium bg-natural-subtle/30"
              placeholder={role === 'tailor' ? "tailorher1@gmail.com" : "name@example.com"}
              required
            />
            {role === 'tailor' && (
              <p className="mt-2 text-[10px] items-center text-natural-gold font-bold uppercase tracking-tighter">
                * Required: tailorher [1-5] @gmail.com
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-natural-text/40 uppercase tracking-widest mb-2 ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-natural-gold/10 focus:outline-none focus:ring-4 focus:ring-natural-gold/5 transition-all text-natural-text font-medium bg-natural-subtle/30"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-natural-gold text-white rounded-2xl font-bold hover:bg-natural-gold/90 transition-all shadow-2xl shadow-natural-gold/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span className="uppercase tracking-widest text-sm">Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-natural-gold/10"></div></div>
          <div className="relative flex justify-center text-sm uppercase"><span className="px-2 bg-white text-natural-text/40 font-bold tracking-widest text-[10px]">Or register with</span></div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 bg-white border border-natural-gold/10 text-natural-text rounded-xl font-medium hover:bg-natural-bg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          <span className="uppercase tracking-widest text-xs">Google Account</span>
        </button>

        <p className="mt-10 text-center text-natural-text/60 text-sm">
          Already have an account? <Link to="/login" state={{ from: location.state?.from }} className="text-natural-peach font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
