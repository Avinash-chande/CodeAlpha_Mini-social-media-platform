import { NavLink } from 'react-router-dom';
import { Activity, Share2, Layers } from 'lucide-react';

export default function Navbar() {
  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-tight">MiniSocial</span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Phase 1
            </span>
          </div>
        </NavLink>

        <nav className="flex items-center gap-2">
          <NavLink to="/" className={navLinkClass}>
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              Overview
            </span>
          </NavLink>
          <NavLink to="/health" className={navLinkClass}>
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              API Health
            </span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
