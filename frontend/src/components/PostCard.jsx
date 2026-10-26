import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { postAPI } from '../services/api'
import { formatRelativeTime } from '../utils/formatTime'
import {
  Edit3,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react'

export default function PostCard({ post, onPostUpdated, onPostDeleted }) {
  const { user: authUser } = useAuth()

  // State for in-place edit
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content || '')
  const [editImage, setEditImage] = useState(post.image || '')
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Determine post owner
  const isOwner = Boolean(
    authUser &&
      post.author &&
      (authUser._id === post.author._id || authUser._id === post.author)
  )

  const authorUsername = post.author?.username || 'Unknown'
  const authorAvatar = post.author?.profilePicture || ''
  const authorId = post.author?._id || post.author

  // Start editing
  const handleStartEdit = () => {
    setEditContent(post.content || '')
    setEditImage(post.image || '')
    setEditError('')
    setIsEditing(true)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditError('')
  }

  // Submit edit
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    setEditError('')

    const cleanContent = editContent.trim()
    if (!cleanContent) {
      setEditError('Content cannot be empty.')
      return
    }

    if (cleanContent.length > 1000) {
      setEditError('Content cannot exceed 1000 characters.')
      return
    }

    try {
      setIsSaving(true)
      const data = await postAPI.updatePost(post._id, {
        content: cleanContent,
        image: editImage.trim(),
      })

      setIsEditing(false)
      if (onPostUpdated && data.post) {
        onPostUpdated(data.post)
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update post.')
    } finally {
      setIsSaving(false)
    }
  }

  // Confirm delete
  const handleDelete = async () => {
    setDeleteError('')
    try {
      setIsDeleting(true)
      await postAPI.deletePost(post._id)
      if (onPostDeleted) {
        onPostDeleted(post._id)
      }
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete post.')
      setIsDeleting(false)
    }
  }

  const isEdited =
    post.updatedAt &&
    post.createdAt &&
    new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 1000

  return (
    <article
      id={`post-${post._id}`}
      className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-xl transition-all hover:border-slate-700/80"
    >
      {/* Header: Author info, timestamp, and Owner Controls */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <Link
          to={`/profile/${authorId}`}
          className="flex items-center gap-3 group"
        >
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorUsername}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-800 group-hover:ring-blue-500/50 transition-all"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.nextElementSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div
            className={`w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md ring-2 ring-slate-800 group-hover:ring-blue-500/50 transition-all ${
              authorAvatar ? 'hidden' : 'flex'
            }`}
          >
            {authorUsername ? authorUsername[0].toUpperCase() : 'U'}
          </div>

          <div>
            <div className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <span>{authorUsername}</span>
              {isOwner && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                  Author
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span title={new Date(post.createdAt).toLocaleString()}>
                {formatRelativeTime(post.createdAt)}
              </span>
              {isEdited && <span className="text-slate-500 italic">• edited</span>}
            </div>
          </div>
        </Link>

        {/* Owner Controls (Edit and Delete) */}
        {isOwner && !isEditing && (
          <div className="relative">
            <div className="flex items-center gap-1">
              <button
                id={`edit-post-btn-${post._id}`}
                type="button"
                onClick={handleStartEdit}
                title="Edit post"
                className="p-1.5 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                id={`delete-post-btn-${post._id}`}
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete post"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal / Inline Alert */}
      {showDeleteConfirm && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs animate-in fade-in duration-200">
          <div className="font-semibold text-sm text-rose-300 mb-1">
            Delete this post?
          </div>
          <p className="text-slate-400 mb-3">
            This action cannot be undone and will permanently remove this post.
          </p>
          {deleteError && (
            <p className="text-rose-400 mb-2 font-medium">{deleteError}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              id={`confirm-delete-btn-${post._id}`}
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete</span>
                </>
              )}
            </button>
            <button
              id={`cancel-delete-btn-${post._id}`}
              type="button"
              disabled={isDeleting}
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* In-place Editing Form vs Normal Post Body */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="space-y-3">
          {editError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div>{editError}</div>
            </div>
          )}

          <div>
            <textarea
              id={`edit-content-input-${post._id}`}
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={1000}
              disabled={isSaving}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none"
              required
            />
            <div className="text-right text-[11px] text-slate-500 mt-0.5">
              {editContent.length}/1000
            </div>
          </div>

          {/* Edit Image URL */}
          <div>
            <label
              htmlFor={`edit-image-input-${post._id}`}
              className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1"
            >
              Image URL (optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`edit-image-input-${post._id}`}
                type="url"
                value={editImage}
                onChange={(e) => setEditImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={isSaving}
                className="flex-1 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              {editImage && (
                <button
                  type="button"
                  onClick={() => setEditImage('')}
                  className="px-2.5 py-1.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 cursor-pointer"
                >
                  Clear Image
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              id={`cancel-edit-btn-${post._id}`}
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id={`save-edit-btn-${post._id}`}
              type="submit"
              disabled={isSaving || !editContent.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          {/* Content */}
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">
            {post.content}
          </p>

          {/* Optional Post Image */}
          {post.image && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/60 max-h-[460px] flex items-center justify-center">
              <img
                src={post.image}
                alt="Post attachment"
                className="w-full max-h-[460px] object-cover rounded-2xl transition-transform hover:scale-[1.01] duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          )}
        </div>
      )}
    </article>
  )
}
