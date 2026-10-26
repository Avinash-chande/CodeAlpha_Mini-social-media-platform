import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { userAPI, authAPI } from '../services/api'
import {
  User as UserIcon,
  Calendar,
  Edit3,
  Users,
  UserCheck,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'

// Avatar presets for quick profile customization
const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
]

export default function Profile() {
  const { id } = useParams()
  const { user: authUser, updateUser } = useAuth()
  const navigate = useNavigate()

  const [profileUser, setProfileUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    username: '',
    bio: '',
    profilePicture: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  // Determine if viewing own profile
  const isOwnProfile =
    !id ||
    id === 'me' ||
    (authUser &&
      (authUser._id === id ||
        authUser.username?.toLowerCase() === id?.toLowerCase()))

  // Fetch profile data
  useEffect(() => {
    let isMounted = true

    const fetchProfile = async () => {
      setIsLoading(true)
      setError('')

      try {
        if (isOwnProfile) {
          // Fetch fresh data for authenticated user
          const data = await authAPI.getMe()
          if (isMounted) {
            setProfileUser(data.user)
            setEditFormData({
              username: data.user.username || '',
              bio: data.user.bio || '',
              profilePicture: data.user.profilePicture || '',
            })
          }
        } else {
          // Fetch public profile by ID or username
          const data = await userAPI.getProfile(id)
          if (isMounted) {
            setProfileUser(data.user)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load profile')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchProfile()

    return () => {
      isMounted = false
    }
  }, [id, isOwnProfile])

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!profileUser) return
    setEditFormData({
      username: profileUser.username || '',
      bio: profileUser.bio || '',
      profilePicture: profileUser.profilePicture || '',
    })
    setEditError('')
    setEditSuccess('')
    setIsEditing(true)
  }

  // Handle Edit Form Change
  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({ ...prev, [name]: value }))
    if (editError) setEditError('')
  }

  // Select Preset Avatar
  const handleSelectPreset = (url) => {
    setEditFormData((prev) => ({ ...prev, profilePicture: url }))
  }

  // Handle Profile Update Submission
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setEditError('')
    setEditSuccess('')

    const cleanUsername = editFormData.username.trim()
    if (!cleanUsername) {
      setEditError('Username cannot be empty.')
      return
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setEditError('Username must be between 3 and 30 characters.')
      return
    }

    if (editFormData.bio.length > 300) {
      setEditError('Bio cannot exceed 300 characters.')
      return
    }

    try {
      setIsSaving(true)
      const data = await userAPI.updateMyProfile({
        username: cleanUsername,
        bio: editFormData.bio.trim(),
        profilePicture: editFormData.profilePicture.trim(),
      })

      setProfileUser(data.user)
      updateUser(data.user)
      setEditSuccess('Profile updated successfully!')

      setTimeout(() => {
        setIsEditing(false)
        setEditSuccess('')
      }, 900)
    } catch (err) {
      setEditError(err.message || 'Failed to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  // Format joined date
  const joinedDate = profileUser?.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently'

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-100">
        <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
        <p className="mt-4 text-sm font-medium text-slate-400">
          Loading profile...
        </p>
      </div>
    )
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Profile Not Found</h2>
          <p className="text-sm text-slate-400 mb-6">
            {error || 'The user you are looking for does not exist.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl relative">
          {/* Header decorative cover */}
          <div className="h-36 sm:h-48 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
            <div className="absolute -bottom-10 right-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          </div>

          {/* Profile details container */}
          <div className="px-6 sm:px-8 pb-8 pt-0 relative z-10">
            {/* Top row: Avatar & Action button */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-6">
              {/* Avatar */}
              <div className="relative group self-start">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl p-1 bg-slate-900 ring-4 ring-slate-900 shadow-2xl overflow-hidden flex items-center justify-center bg-slate-800">
                  {profileUser.profilePicture ? (
                    <img
                      src={profileUser.profilePicture}
                      alt={profileUser.username}
                      className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-3xl sm:text-4xl flex items-center justify-center shadow-inner ${
                      profileUser.profilePicture ? 'hidden' : 'flex'
                    }`}
                  >
                    {profileUser.username
                      ? profileUser.username[0].toUpperCase()
                      : 'U'}
                  </div>
                </div>

                {isOwnProfile && (
                  <button
                    id="change-avatar-btn"
                    type="button"
                    onClick={handleOpenEdit}
                    title="Change picture"
                    className="absolute bottom-2 right-2 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-transform active:scale-95 cursor-pointer z-10"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Action Button */}
              <div className="flex items-center gap-3 relative z-10">
                {isOwnProfile ? (
                  <button
                    id="edit-profile-btn"
                    type="button"
                    onClick={handleOpenEdit}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-white font-semibold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 text-blue-400" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    id="follow-btn"
                    type="button"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>Follow</span>
                  </button>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {profileUser.username}
                  </h1>
                  {isOwnProfile && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" />
                      You
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-400 mt-0.5">
                  @{profileUser.username}
                </p>
              </div>

              {/* Bio */}
              <div className="text-slate-300 text-sm leading-relaxed max-w-2xl bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl">
                {profileUser.bio ? (
                  <p className="whitespace-pre-line">{profileUser.bio}</p>
                ) : (
                  <p className="text-slate-500 italic">
                    {isOwnProfile
                      ? 'No bio yet. Click "Edit Profile" to share something about yourself.'
                      : 'No bio provided.'}
                  </p>
                )}
              </div>

              {/* Meta details */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Joined {joinedDate}</span>
                </div>
                {isOwnProfile && profileUser.email && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="text-slate-600">•</span>
                    <span>{profileUser.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards (Followers, Following, Posts) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-800">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-center hover:border-slate-700 transition-colors">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {profileUser.postCount ?? 0}
                </div>
                <div className="text-xs font-medium text-slate-400 mt-1 flex items-center justify-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Posts</span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-center hover:border-slate-700 transition-colors">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {profileUser.followersCount ??
                    (profileUser.followers ? profileUser.followers.length : 0)}
                </div>
                <div className="text-xs font-medium text-slate-400 mt-1 flex items-center justify-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Followers</span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-center hover:border-slate-700 transition-colors">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {profileUser.followingCount ??
                    (profileUser.following ? profileUser.following.length : 0)}
                </div>
                <div className="text-xs font-medium text-slate-400 mt-1 flex items-center justify-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-violet-400" />
                  <span>Following</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Tab / Placeholder Section */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Posts</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {profileUser.postCount === 0
              ? `${profileUser.username} hasn't posted anything yet. Posts and feed features will arrive in Phase 3!`
              : `${profileUser.username} has ${profileUser.postCount} posts.`}
          </p>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Edit Profile</h3>
              </div>
              <button
                id="close-modal-btn"
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              {/* Error / Success Alerts */}
              {editError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>{editError}</div>
                </div>
              )}

              {editSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
                  <Check className="w-5 h-5 shrink-0" />
                  <div>{editSuccess}</div>
                </div>
              )}

              {/* Username Input */}
              <div>
                <label
                  htmlFor="edit-username"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="edit-username"
                    name="username"
                    type="text"
                    value={editFormData.username}
                    onChange={handleEditChange}
                    disabled={isSaving}
                    maxLength={30}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Bio Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="edit-bio"
                    className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
                  >
                    Bio
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {editFormData.bio.length}/300
                  </span>
                </div>
                <textarea
                  id="edit-bio"
                  name="bio"
                  rows="3"
                  value={editFormData.bio}
                  onChange={handleEditChange}
                  disabled={isSaving}
                  maxLength={300}
                  placeholder="Tell others about your interests, passions, or hobbies..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              {/* Profile Picture URL */}
              <div>
                <label
                  htmlFor="edit-picture"
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
                >
                  Profile Picture URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="edit-picture"
                    name="profilePicture"
                    type="url"
                    value={editFormData.profilePicture}
                    onChange={handleEditChange}
                    disabled={isSaving}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Avatar Quick Presets */}
                <div className="mt-3">
                  <div className="text-[11px] font-medium text-slate-400 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Or choose a sample avatar:</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        id={`avatar-preset-${idx}`}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 transition-all cursor-pointer ${
                          editFormData.profilePicture === preset
                            ? 'ring-blue-500 scale-105'
                            : 'ring-slate-700 hover:ring-slate-500'
                        }`}
                      >
                        <img
                          src={preset}
                          alt={`Preset ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                    {editFormData.profilePicture && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData((prev) => ({
                            ...prev,
                            profilePicture: '',
                          }))
                        }
                        className="px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  id="cancel-profile-btn"
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-profile-btn"
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
