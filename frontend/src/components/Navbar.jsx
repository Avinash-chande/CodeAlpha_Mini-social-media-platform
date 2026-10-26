import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LogOut,
  Home as HomeIcon,
  Sparkles,
} from 'lucide-react'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Branding */}
          <Link
            to="/"
            className="flex items-center gap-3 group transition-transform duration-200 active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              M
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
                MiniSocial
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v2
                </span>
              </span>
              <span className="text-[11px] text-slate-400 -mt-1 hidden sm:inline">
                Connect & Share
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-slate-800 text-blue-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <HomeIcon className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  id="navbar-profile-link"
                  to="/profile"
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/profile')
                      ? 'bg-slate-800 text-blue-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-blue-500/50"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center text-xs font-semibold">
                      {user?.username ? user.username[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="font-medium truncate max-w-[120px]">
                    @{user?.username}
                  </span>
                </Link>

                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  type="button"
                  title="Sign out"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  id="signin-btn"
                  to="/login"
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/login')
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  id="register-btn"
                  to="/register"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
