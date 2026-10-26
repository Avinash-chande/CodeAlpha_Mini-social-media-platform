import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

export default function Home() {
  const { user, isAuthenticated } = useAuth()

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full space-y-6 relative z-10">
        {/* Main Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl shadow-xl shadow-blue-500/25">
            M
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Mini Social Media Platform
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-lg mx-auto">
              A modern, full-stack social platform powered by React 19, Tailwind CSS v4, Express, and MongoDB.
            </p>
          </div>

          {/* User state context */}
          {isAuthenticated && user ? (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                    {user.username ? user.username[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    {user.username}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      Authenticated
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {user.email || `@${user.username}`}
                  </div>
                </div>
              </div>

              <Link
                to="/profile"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/25 active:scale-95 transition-all"
              >
                <span>View Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/login"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white font-semibold text-sm transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get Started</span>
              </Link>
            </div>
          )}

          {/* Phase tracker badges */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">
                  Phase 1: Project Setup
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Vite + React 19 + Tailwind v4 + Express + MongoDB
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">
                  Phase 2: Auth & Profiles
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  JWT, bcryptjs, Register, Login, Protected Routes & Profile Editing
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
