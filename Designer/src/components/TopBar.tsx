import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';
import { useFirebaseApp } from 'reactfire';
import { useAuth } from '../contexts/AuthContext';

export default function TopBar() {
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  async function handleLogout() {
    await signOut(auth);
    navigate('/login');
  }

  const initials = currentUser?.displayName
    ? currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : currentUser?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 lg:px-20 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-10">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
              <span className="material-symbols-outlined">view_in_ar</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">EduAR Designer</h2>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/dashboard"
              className={`text-sm font-semibold pb-1 ${isActive('/dashboard') ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-primary transition-colors'}`}
            >
              Dashboard
            </Link>
            <Link
              to="/experiments"
              className={`text-sm font-semibold pb-1 ${isActive('/experiments') ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-primary transition-colors'}`}
            >
              Experiments
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center justify-center rounded-lg size-10 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-sm"
            >
              {initials}
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-2">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900 truncate">{currentUser?.displayName || 'Instructor'}</p>
                    <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
