import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { postAPI, userAPI } from '../services/api'
import CreatePostCard from '../components/CreatePostCard'
import PostCard from '../components/PostCard'
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Loader2,
  LogIn,
  Layers,
  Compass,
  Users,
  UserCheck,
  UserPlus,
} from 'lucide-react'

export default function Home() {
  const { user, isAuthenticated } = useAuth()

  // Feed Tab State: 'following' (default for logged-in) or 'explore' (global)
  const [activeTab, setActiveTab] = useState(
    isAuthenticated ? 'following' : 'explore'
  )

  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalPosts, setTotalPosts] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState('')

  // Suggested users state
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [followingActionMap, setFollowingActionMap] = useState({})

  // Fetch feed based on active tab and target page
  const fetchFeed = useCallback(
    async (targetPage = 1, append = false, tab = activeTab) => {
      if (targetPage === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError('')

      try {
        let data
        if (tab === 'following' && isAuthenticated) {
          data = await postAPI.getFeed({ page: targetPage, limit: 10 })
        } else {
          data = await postAPI.getPosts({ page: targetPage, limit: 10 })
        }

        if (append) {
          setPosts((prev) => {
            // Avoid duplicate posts by checking IDs
            const existingIds = new Set(prev.map((p) => p._id))
            const newPosts = (data.posts || []).filter(
              (p) => !existingIds.has(p._id)
            )
            return [...prev, ...newPosts]
          })
        } else {
          setPosts(data.posts || [])
        }

        setPage(data.page || targetPage)
        setHasMore(data.hasMore || false)
        setTotalPosts(data.totalPosts || 0)
      } catch (err) {
        setError(err.message || 'Failed to load feed.')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [activeTab, isAuthenticated]
  )

  // Fetch suggested users to follow
  const fetchSuggestions = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoadingSuggestions(true)
    try {
      const data = await userAPI.getSuggestions()
      setSuggestedUsers(data.users || [])
    } catch (err) {
      console.warn('Could not load user suggestions:', err)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [isAuthenticated])

  // Trigger feed load when activeTab changes
  useEffect(() => {
    fetchFeed(1, false, activeTab)
  }, [activeTab, fetchFeed])

  // Load suggestions on mount
  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  // Handle follow/unfollow on suggested user widget
  const handleFollowSuggested = async (suggestedUserId) => {
    if (!isAuthenticated) return

    setFollowingActionMap((prev) => ({ ...prev, [suggestedUserId]: true }))

    try {
      const res = await userAPI.followUser(suggestedUserId)
      setSuggestedUsers((prev) =>
        prev.map((u) =>
          u._id === suggestedUserId
            ? {
                ...u,
                isFollowing: res.isFollowing,
                followersCount: res.followersCount,
              }
            : u
        )
      )

      // If on following feed, refresh to include newly followed user's posts
      if (activeTab === 'following' && res.isFollowing) {
        fetchFeed(1, false, 'following')
      }
    } catch (err) {
      console.error('Follow suggestion error:', err)
    } finally {
      setFollowingActionMap((prev) => ({ ...prev, [suggestedUserId]: false }))
    }
  }

  // Handle new post created -> prepend without page reload
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev])
    setTotalPosts((prev) => prev + 1)
  }

  // Handle post edited -> update in place without page reload
  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    )
  }

  // Handle post deleted -> filter out without page reload
  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId))
    setTotalPosts((prev) => Math.max(0, prev - 1))
  }

  // Handle load more
  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return
    fetchFeed(page + 1, true, activeTab)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed Column (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feed Header with Tab Switcher */}
          <div className="pb-2 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>{activeTab === 'following' ? 'Your Feed' : 'Explore Community'}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {totalPosts} {totalPosts === 1 ? 'post' : 'posts'}
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeTab === 'following'
                    ? 'Latest updates from creators you follow and your own posts'
                    : 'Discover real-time discussions from everyone across the platform'}
                </p>
              </div>

              <button
                id="refresh-feed-btn"
                type="button"
                onClick={() => fetchFeed(1, false, activeTab)}
                disabled={isLoading}
                title="Refresh feed"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`}
                />
              </button>
            </div>

            {/* Feed Tabs: Following vs Explore */}
            {isAuthenticated && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  id="tab-following"
                  type="button"
                  onClick={() => setActiveTab('following')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'following'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Following Feed</span>
                </button>

                <button
                  id="tab-explore"
                  type="button"
                  onClick={() => setActiveTab('explore')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'explore'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Explore All</span>
                </button>
              </div>
            )}
          </div>

          {/* Composer Card if Logged in / Guest Card if not */}
          {isAuthenticated ? (
            <CreatePostCard onPostCreated={handlePostCreated} />
          ) : (
            <div className="bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900 border border-blue-500/30 rounded-3xl p-6 shadow-xl text-center space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-blue-600/20 text-blue-400 mb-1">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">
                Join the conversation!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                Sign in or register an account to follow creators, personalize your
                feed, and publish your own posts.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Register Free</span>
                </Link>
              </div>
            </div>
          )}

          {/* Error Banner with Retry */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchFeed(1, false, activeTab)}
                className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Feed List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 w-28 bg-slate-800 rounded" />
                      <div className="h-3 w-16 bg-slate-800/60 rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-800 rounded" />
                    <div className="h-4 w-3/4 bg-slate-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                {activeTab === 'following' ? (
                  <Users className="w-6 h-6 text-blue-400" />
                ) : (
                  <MessageSquare className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-base font-bold text-white">
                {activeTab === 'following'
                  ? 'No posts from people you follow yet'
                  : 'No posts yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {activeTab === 'following'
                  ? 'Follow more creators to see their updates here, or explore the global community feed!'
                  : 'Be the first to share an update with the community! Use the composer above to publish your thoughts.'}
              </p>
              {activeTab === 'following' && (
                <div className="pt-2">
                  <button
                    id="switch-to-explore-btn"
                    type="button"
                    onClick={() => setActiveTab('explore')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Explore Community Feed</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                />
              ))}

              {/* Load More Pagination */}
              {hasMore && (
                <div className="pt-2 text-center">
                  <button
                    id="load-more-btn"
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold shadow-md active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        <span>Loading more posts...</span>
                      </>
                    ) : (
                      <span>Load More Posts</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Column (1 col on lg) */}
        <div className="space-y-6">
          {/* User Profile Summary Card (if authenticated) */}
          {isAuthenticated && user && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/40"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                    {user.username ? user.username[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <div className="font-bold text-white leading-tight">
                    {user.username}
                  </div>
                  <div className="text-xs text-slate-400">@{user.username}</div>
                </div>
              </div>

              {user.bio && (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 line-clamp-2">
                  {user.bio}
                </p>
              )}

              <Link
                to="/profile"
                className="w-full block text-center py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                View Full Profile
              </Link>
            </div>
          )}

          {/* Suggested Creators Widget (Task 9: meaningful suggestions) */}
          {isAuthenticated && suggestedUsers.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-sm text-white">Who to Follow</h3>
                </div>
                <button
                  type="button"
                  onClick={fetchSuggestions}
                  title="Refresh suggestions"
                  className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isLoadingSuggestions ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>

              <div className="space-y-3">
                {suggestedUsers.map((su) => (
                  <div
                    key={su._id}
                    id={`suggested-user-${su._id}`}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors"
                  >
                    <Link
                      to={`/profile/${su._id}`}
                      className="flex items-center gap-2.5 min-w-0 group flex-1"
                    >
                      {su.profilePicture ? (
                        <img
                          src={su.profilePicture}
                          alt={su.username}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-800 group-hover:ring-blue-500/40"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs ring-1 ring-slate-800 shrink-0">
                          {su.username[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                          @{su.username}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {su.followersCount} {su.followersCount === 1 ? 'follower' : 'followers'}
                        </div>
                      </div>
                    </Link>

                    <button
                      id={`suggested-follow-btn-${su._id}`}
                      type="button"
                      onClick={() => handleFollowSuggested(su._id)}
                      disabled={followingActionMap[su._id]}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        su.isFollowing
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                      }`}
                    >
                      {followingActionMap[su._id] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : su.isFollowing ? (
                        <>
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Status & Roadmap */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-sm text-white">Project Roadmap</h3>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    Phase 1: Project Setup
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Vite, React 19, Tailwind v4, Express, MongoDB
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    Phase 2: Auth & Profiles
                  </div>
                  <div className="text-[11px] text-slate-400">
                    JWT Auth, Login, Register, Profile Editing
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    Phase 3: Posts & Feed
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Create, Read, Edit, Delete posts, Image attachments & Feed
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    Phase 4: Likes & Comments
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Real-time likes, full comment thread, moderation & editing
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    Phase 5: Follow System
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Follow/unfollow, followers & following counters and lists
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">
                    Phase 6: Personalized Feed & Search
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Following feed, user search, and creator suggestions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
