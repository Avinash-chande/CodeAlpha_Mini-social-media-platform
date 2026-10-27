import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userAPI } from '../services/api'
import {
  LogOut,
  Home as HomeIcon,
  Sparkles,
  Search,
  X,
  Loader2,
  Users,
} from 'lucide-react'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const searchContainerRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  // Debounced search
  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const timeoutId = setTimeout(async () => {
      try {
        const data = await userAPI.searchUsers(trimmed)
        setSearchResults(data.users || [])
      } catch (err) {
        console.error('Search error:', err)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 250)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle selecting a user
  const handleSelectUser = (userId) => {
    setShowDropdown(false)
    setSearchQuery('')
    navigate(`/profile/${userId}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo / Branding */}
          <Link
            to="/"
            className="flex items-center gap-3 group transition-transform duration-200 active:scale-95 shrink-0"
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

          {/* User Search Bar */}
          <div
            ref={searchContainerRef}
            className="relative flex-1 max-w-xs sm:max-w-sm lg:max-w-md mx-2"
          >
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>

              <input
                id="search-users-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setShowDropdown(true)
                }}
                placeholder="Search users..."
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
              />

              {isSearching ? (
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                </div>
              ) : searchQuery ? (
                <button
                  id="clear-search-btn"
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setShowDropdown(false)
                  }}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            {/* Live Search Results Dropdown */}
            {showDropdown && searchQuery.trim() && (
              <div
                id="search-dropdown-menu"
                className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150 max-h-80 overflow-y-auto"
              >
                {isSearching && searchResults.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    <span>Searching for "{searchQuery}"...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-300">
                      No users found
                    </p>
                    <p className="text-[11px] text-slate-500">
                      No matching username or bio for "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <div className="p-1.5 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      People ({searchResults.length})
                    </div>
                    {searchResults.map((matchedUser) => (
                      <button
                        key={matchedUser._id}
                        id={`search-result-${matchedUser._id}`}
                        type="button"
                        onClick={() => handleSelectUser(matchedUser._id)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl text-left hover:bg-slate-800/80 transition-colors cursor-pointer group"
                      >
                        {matchedUser.profilePicture ? (
                          <img
                            src={matchedUser.profilePicture}
                            alt={matchedUser.username}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-800 group-hover:ring-blue-500/40"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs ring-1 ring-slate-800 group-hover:ring-blue-500/40 shrink-0">
                            {matchedUser.username[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-slate-200 group-hover:text-blue-400 transition-colors truncate flex items-center gap-1.5">
                            <span>@{matchedUser.username}</span>
                            {user && user._id === matchedUser._id && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                You
                              </span>
                            )}
                          </div>
                          {matchedUser.bio ? (
                            <p className="text-[11px] text-slate-400 truncate">
                              {matchedUser.bio}
                            </p>
                          ) : (
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Users className="w-2.5 h-2.5" />
                              <span>{matchedUser.followersCount} followers</span>
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-slate-800 text-blue-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <HomeIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
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
                  <span className="font-medium truncate max-w-[100px] sm:max-w-[120px]">
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
