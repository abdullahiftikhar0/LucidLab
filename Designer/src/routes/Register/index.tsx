import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebaseApp } from 'reactfire';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  if (!authLoading && currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 bg-primary rounded-lg flex items-center justify-center text-white animate-pulse">
            <span className="material-symbols-outlined text-3xl">view_in_ar</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  async function handleGoogleSSO() {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          role: 'instructor',
          institution: '',
          classroomIds: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      // Create Firestore user document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: fullName,
        role: 'instructor',
        institution: institution || '',
        classroomIds: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate('/dashboard');
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try logging in instead.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters with a mix of letters and numbers.');
      } else if (code === 'auth/operation-not-allowed') {
        setError('Email/password registration is not enabled. Please contact support.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment and try again.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Something went wrong. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="bg-background-light font-display text-slate-900 min-h-screen flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Top Navigation Bar */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-xl">view_in_ar</span>
          </div>
          <h1 className="text-slate-900 text-xl font-bold tracking-tight">
            EduAR <span className="text-primary">Designer</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 hidden sm:block">Already have an account?</span>
          <Link
            to="/login"
            className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Log In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background-light to-background-light">
        <div className="w-full max-w-[460px] bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8">
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
              Create your account
            </h2>
            <p className="text-slate-500 text-base">
              Join the community of instructors designing the future of science education.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4">
              <div className="bg-red-50 border border-red-100 p-3 rounded flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                <p className="text-xs text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  person
                </span>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="Dr. Jane Smith"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Work Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  mail
                </span>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="jane.smith@institution.edu"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Institution */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Institution{' '}
                <span className="font-normal text-slate-400 text-xs uppercase ml-1">(Optional)</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  school
                </span>
                <input
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 placeholder:text-slate-400"
                  placeholder="University of Science &amp; Tech"
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 ml-1">Confirm</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock_reset
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 placeholder:text-slate-400"
                    placeholder="••••••••"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 py-2">
              <input
                className="mt-1 size-4 rounded border-slate-300 text-primary focus:ring-primary"
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <label className="text-xs text-slate-500 leading-relaxed" htmlFor="terms">
                By creating an account, you agree to our{' '}
                <a className="text-primary hover:underline font-medium" href="#">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a className="text-primary hover:underline font-medium" href="#">
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            {/* Action Button */}
            <button
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-6 rounded-lg transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="material-symbols-outlined text-xl animate-spin">
                  progress_activity
                </span>
              ) : (
                <>
                  <span>Create Account</span>
                  <span className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Social/Other Options */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Or register with
            </p>
            <div className="flex gap-4 w-full">
              <button
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
                type="button"
                onClick={handleGoogleSSO}
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.228 1.216-3.144 2.352-6.4 2.352-5.092 0-9.12-4.132-9.12-9.224s4.028-9.224 9.12-9.224c2.752 0 4.748 1.08 6.176 2.444l2.304-2.304c-2.088-1.984-4.872-3.48-8.48-3.48-6.392 0-11.68 5.176-11.68 11.56s5.288 11.56 11.68 11.56c3.48 0 6.12-1.152 8.136-3.264 2.104-2.104 2.768-5.064 2.768-7.44 0-.704-.064-1.376-.192-2.016h-10.704z" />
                </svg>
                <span className="text-sm font-semibold">Google</span>
              </button>
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Already an EduAR Designer?{' '}
              <Link className="text-primary font-bold hover:underline" to="/login">
                Log in to your workspace
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="w-full px-8 py-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 uppercase tracking-widest font-bold">
        <div className="flex items-center gap-6">
          <a className="hover:text-primary transition-colors" href="#">
            Support
          </a>
          <a className="hover:text-primary transition-colors" href="#">
            Documentation
          </a>
          <a className="hover:text-primary transition-colors" href="#">
            API
          </a>
        </div>
        <div>© 2026 EduAR Inc.</div>
      </footer>
    </div>
  );
}
