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
  Heart,
  MessageSquare,
  Send,
  Shield,
  LogIn,
} from 'lucide-react'


export default function PostCard({ post, onPostUpdated, onPostDeleted }) {
  const { user: authUser, isAuthenticated } = useAuth()

  // State for in-place edit of the post
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content || '')
  const [editImage, setEditImage] = useState(post.image || '')
  const [isSaving, setIsSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // State for post delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Likes state
  const [likes, setLikes] = useState(post.likes || [])
  const [likesCount, setLikesCount] = useState(
    typeof post.likesCount === 'number'
      ? post.likesCount
      : post.likes?.length || 0
  )
  const [isLiking, setIsLiking] = useState(false)
  const [likeError, setLikeError] = useState('')

  // Determine if current user liked this post
  const currentUserId = authUser?._id?.toString()
  const isLiked = Boolean(
    currentUserId &&
      likes.some((uid) => {
        const id = typeof uid === 'string' ? uid : uid?._id || uid
        return id?.toString() === currentUserId
      })
  )

  // Comments drawer state
  const [showComments, setShowComments] = useState(false)
  const [commentsCount, setCommentsCount] = useState(
    typeof post.commentsCount === 'number' ? post.commentsCount : 0
  )
  const [comments, setComments] = useState([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentsError, setCommentsError] = useState('')

  // Add comment form state
  const [newCommentText, setNewCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [addCommentError, setAddCommentError] = useState('')

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [isSavingCommentEdit, setIsSavingCommentEdit] = useState(false)
  const [commentEditError, setCommentEditError] = useState('')

  // Delete comment confirmation state
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null)
  const [deletingCommentId, setDeletingCommentId] = useState(null)
  const [commentDeleteError, setCommentDeleteError] = useState('')

  // Determine post owner
  const isOwner = Boolean(
    authUser &&
      post.author &&
      (authUser._id === post.author._id || authUser._id === post.author)
  )

  const authorUsername = post.author?.username || 'Unknown'
  const authorAvatar = post.author?.profilePicture || ''
  const authorId = post.author?._id || post.author

  // Start editing post
  const handleStartEdit = () => {
    setEditContent(post.content || '')
    setEditImage(post.image || '')
    setEditError('')
    setIsEditing(true)
  }

  // Cancel editing post
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditError('')
  }

  // Submit edit post
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

  // Confirm delete post
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

  // Toggle Like / Unlike
  const handleToggleLike = async () => {
    if (!isAuthenticated || !authUser) {
      setLikeError('Please sign in to like this post.')
      setTimeout(() => setLikeError(''), 4000)
      return
    }

    // Prevent duplicate submissions while request is processing
    if (isLiking) return

    setLikeError('')
    setIsLiking(true)

    try {
      const data = await postAPI.likePost(post._id)

      setLikes(data.likes || [])
      setLikesCount(data.likesCount ?? (data.likes ? data.likes.length : 0))

      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          likes: data.likes,
          likesCount: data.likesCount,
          isLiked: data.isLiked,
        })
      }
    } catch (err) {
      setLikeError(err.message || 'Failed to update like status.')
      setTimeout(() => setLikeError(''), 4000)
    } finally {
      setIsLiking(false)
    }
  }

  // Toggle Comments Drawer
  const handleToggleComments = async () => {
    const nextShow = !showComments
    setShowComments(nextShow)

    if (nextShow && !commentsLoaded) {
      await fetchComments()
    }
  }

  // Fetch comments from backend
  const fetchComments = async () => {
    try {
      setIsLoadingComments(true)
      setCommentsError('')
      const data = await postAPI.getComments(post._id)
      setComments(data.comments || [])
      setCommentsCount(
        data.totalComments ?? (data.comments ? data.comments.length : 0)
      )
      setCommentsLoaded(true)
    } catch (err) {
      setCommentsError(err.message || 'Could not load comments.')
    } finally {
      setIsLoadingComments(false)
    }
  }

  // Submit new comment
  const handleAddComment = async (e) => {
    e.preventDefault()

    const cleanContent = newCommentText.trim()
    if (!cleanContent) return

    if (cleanContent.length > 500) {
      setAddCommentError('Comment cannot exceed 500 characters.')
      return
    }

    // Prevent duplicate submission while request is processing
    if (isSubmittingComment) return

    setAddCommentError('')
    setIsSubmittingComment(true)

    try {
      const data = await postAPI.addComment(post._id, {
        content: cleanContent,
      })

      // Update state without a full page reload
      setComments((prev) => [...prev, data.comment])
      setCommentsCount((prev) => prev + 1)
      setNewCommentText('')

      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          commentsCount: commentsCount + 1,
        })
      }
    } catch (err) {
      setAddCommentError(err.message || 'Failed to submit comment.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Start editing a comment
  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment._id)
    setEditCommentText(comment.content)
    setCommentEditError('')
  }

  // Cancel editing comment
  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditCommentText('')
    setCommentEditError('')
  }

  // Submit comment edit
  const handleSaveCommentEdit = async (commentId) => {
    const cleanContent = editCommentText.trim()
    if (!cleanContent) {
      setCommentEditError('Comment cannot be empty.')
      return
    }

    if (cleanContent.length > 500) {
      setCommentEditError('Comment cannot exceed 500 characters.')
      return
    }

    if (isSavingCommentEdit) return

    setCommentEditError('')
    setIsSavingCommentEdit(true)

    try {
      const data = await postAPI.updateComment(post._id, commentId, {
        content: cleanContent,
      })

      // Update comments list in place without full page reload
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? data.comment : c))
      )
      setEditingCommentId(null)
      setEditCommentText('')
    } catch (err) {
      setCommentEditError(err.message || 'Failed to update comment.')
    } finally {
      setIsSavingCommentEdit(false)
    }
  }

  // Confirm delete comment
  const handleConfirmDeleteComment = async (commentId) => {
    if (deletingCommentId) return

    setCommentDeleteError('')
    setDeletingCommentId(commentId)

    try {
      await postAPI.deleteComment(post._id, commentId)

      // Remove from comments list and decrement count without full page reload
      setComments((prev) => prev.filter((c) => c._id !== commentId))
      setCommentsCount((prev) => Math.max(0, prev - 1))
      setConfirmDeleteCommentId(null)

      if (onPostUpdated) {
        onPostUpdated({
          ...post,
          commentsCount: Math.max(0, commentsCount - 1),
        })
      }
    } catch (err) {
      setCommentDeleteError(err.message || 'Failed to delete comment.')
    } finally {
      setDeletingCommentId(null)
    }
  }

  const isEdited =
    post.updatedAt &&
    post.createdAt &&
    new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() >
      1000

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
              {isEdited && (
                <span className="text-slate-500 italic">• edited</span>
              )}
            </div>
          </div>
        </Link>

        {/* Owner Controls (Edit and Delete Post) */}
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

      {/* Delete Post Confirmation Modal / Inline Alert */}
      {showDeleteConfirm && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs animate-in fade-in duration-200">
          <div className="font-semibold text-sm text-rose-300 mb-1">
            Delete this post?
          </div>
          <p className="text-slate-400 mb-3">
            This action cannot be undone and will permanently remove this post
            and all associated comments.
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

      {/* Like Error Notification */}
      {likeError && (
        <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{likeError}</span>
        </div>
      )}

      {/* Engagement Action Bar: Likes & Comments Controls */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Like Button */}
          <button
            id={`like-btn-${post._id}`}
            type="button"
            onClick={handleToggleLike}
            disabled={isLiking}
            title={isLiked ? 'Unlike post' : 'Like post'}
            className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isLiked
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-sm shadow-rose-500/10 hover:bg-rose-500/20'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/5'
            } active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isLiking ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
            ) : (
              <Heart
                className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                }`}
              />
            )}
            <span id={`like-count-${post._id}`} className="tabular-nums">
              {likesCount}
            </span>
          </button>

          {/* Comment Toggle Button */}
          <button
            id={`comment-btn-${post._id}`}
            type="button"
            onClick={handleToggleComments}
            title="View or add comments"
            className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showComments
                ? 'bg-blue-600/15 border-blue-500/30 text-blue-400 shadow-sm shadow-blue-500/10'
                : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5'
            } active:scale-95`}
          >
            <MessageSquare className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span id={`comment-count-${post._id}`} className="tabular-nums">
              {commentsCount}
            </span>
          </button>
        </div>

        {/* Timestamp / Context status */}
        <div className="text-[11px] text-slate-500 hidden sm:block">
          {likesCount} {likesCount === 1 ? 'like' : 'likes'} • {commentsCount}{' '}
          {commentsCount === 1 ? 'comment' : 'comments'}
        </div>
      </div>

      {/* Collapsible Comments Section */}
      {showComments && (
        <div
          id={`comments-section-${post._id}`}
          className="mt-4 pt-4 border-t border-slate-800/60 space-y-4 animate-in fade-in duration-200"
        >
          {/* Add Comment Input Form (if logged in) or Guest Prompt */}
          {isAuthenticated ? (
            <form onSubmit={handleAddComment} className="space-y-2">
              <div className="flex items-start gap-2.5">
                {/* Current User Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0 ring-1 ring-slate-700 mt-1">
                  {authUser?.profilePicture ? (
                    <img
                      src={authUser.profilePicture}
                      alt={authUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                      {authUser?.username ? authUser.username[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                {/* Input & Submit */}
                <div className="flex-1 space-y-1.5">
                  <div className="relative">
                    <textarea
                      id={`add-comment-input-${post._id}`}
                      rows={2}
                      value={newCommentText}
                      onChange={(e) => {
                        setNewCommentText(e.target.value)
                        if (addCommentError) setAddCommentError('')
                      }}
                      placeholder="Write a comment..."
                      maxLength={500}
                      disabled={isSubmittingComment}
                      className="w-full px-3.5 py-2 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none disabled:opacity-50"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      {newCommentText.length}/500
                    </span>

                    <button
                      id={`add-comment-btn-${post._id}`}
                      type="submit"
                      disabled={
                        isSubmittingComment ||
                        !newCommentText.trim() ||
                        newCommentText.length > 500
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmittingComment ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Comment</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {addCommentError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{addCommentError}</span>
                </div>
              )}
            </form>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 text-center flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-400">
                Sign in to join the conversation and leave a comment.
              </span>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            </div>
          )}

          {/* Comments List Area */}
          <div className="space-y-3 pt-1">
            {isLoadingComments ? (
              <div className="py-6 text-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-400 mb-1.5" />
                <span className="text-xs">Loading comments...</span>
              </div>
            ) : commentsError ? (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-2">
                <span>{commentsError}</span>
                <button
                  type="button"
                  onClick={fetchComments}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            ) : comments.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs italic">
                No comments yet. Start the conversation!
              </div>
            ) : (
              comments.map((comment) => {
                const commentAuthorId =
                  comment.author?._id || comment.author
                const commentAuthorName =
                  comment.author?.username || 'User'
                const commentAuthorPic = comment.author?.profilePicture || ''

                // Authorization: Comment author
                const isCommentAuthor = Boolean(
                  authUser &&
                    commentAuthorId &&
                    authUser._id?.toString() === commentAuthorId.toString()
                )

                // Authorization: Post author (moderation rights)
                const isPostAuthor = isOwner

                // Either author can delete
                const canDelete = isCommentAuthor || isPostAuthor
                // Only comment author can edit
                const canEdit = isCommentAuthor

                const isCommentEdited =
                  comment.updatedAt &&
                  comment.createdAt &&
                  new Date(comment.updatedAt).getTime() -
                    new Date(comment.createdAt).getTime() >
                    1000

                return (
                  <div
                    key={comment._id}
                    id={`comment-item-${comment._id}`}
                    className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2 transition-colors hover:border-slate-800"
                  >
                    {/* Comment Header: Author & Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/profile/${commentAuthorId}`}
                        className="flex items-center gap-2 group"
                      >
                        {commentAuthorPic ? (
                          <img
                            src={commentAuthorPic}
                            alt={commentAuthorName}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-800 group-hover:ring-blue-500/40"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling.style.display =
                                'flex'
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-[10px] ring-1 ring-slate-800 group-hover:ring-blue-500/40 ${
                            commentAuthorPic ? 'hidden' : 'flex'
                          }`}
                        >
                          {commentAuthorName
                            ? commentAuthorName[0].toUpperCase()
                            : 'U'}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-slate-200 group-hover:text-blue-400 transition-colors">
                            {commentAuthorName}
                          </span>

                          {/* Role Badges */}
                          {isCommentAuthor && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                              You
                            </span>
                          )}

                          {isPostAuthor && !isCommentAuthor && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5" />
                              <span>Author</span>
                            </span>
                          )}

                          <span className="text-[10px] text-slate-500">
                            • {formatRelativeTime(comment.createdAt)}
                          </span>

                          {isCommentEdited && (
                            <span className="text-[10px] text-slate-500 italic">
                              • edited
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Action buttons (Edit, Delete) */}
                      <div className="flex items-center gap-1">
                        {canEdit && editingCommentId !== comment._id && (
                          <button
                            id={`edit-comment-btn-${comment._id}`}
                            type="button"
                            onClick={() => handleStartEditComment(comment)}
                            title="Edit comment"
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            id={`delete-comment-btn-${comment._id}`}
                            type="button"
                            onClick={() =>
                              setConfirmDeleteCommentId(comment._id)
                            }
                            title={
                              isPostAuthor && !isCommentAuthor
                                ? 'Remove comment (Post Author)'
                                : 'Delete comment'
                            }
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delete Confirmation Alert */}
                    {confirmDeleteCommentId === comment._id && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs animate-in fade-in">
                        <div className="font-semibold mb-1">
                          Delete this comment?
                        </div>
                        {commentDeleteError && (
                          <p className="text-rose-400 mb-2 font-medium">
                            {commentDeleteError}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            id={`confirm-delete-comment-btn-${comment._id}`}
                            type="button"
                            disabled={deletingCommentId === comment._id}
                            onClick={() =>
                              handleConfirmDeleteComment(comment._id)
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] disabled:opacity-50 cursor-pointer"
                          >
                            {deletingCommentId === comment._id ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Deleting...</span>
                              </>
                            ) : (
                              <span>Yes, Delete</span>
                            )}
                          </button>
                          <button
                            id={`cancel-delete-comment-btn-${comment._id}`}
                            type="button"
                            disabled={deletingCommentId === comment._id}
                            onClick={() => {
                              setConfirmDeleteCommentId(null)
                              setCommentDeleteError('')
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Comment Body / In-place Edit Form */}
                    {editingCommentId === comment._id ? (
                      <div className="space-y-2 pt-1">
                        {commentEditError && (
                          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{commentEditError}</span>
                          </div>
                        )}

                        <textarea
                          id={`edit-comment-input-${comment._id}`}
                          rows={2}
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          maxLength={500}
                          disabled={isSavingCommentEdit}
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        />

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">
                            {editCommentText.length}/500
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              id={`cancel-edit-comment-btn-${comment._id}`}
                              type="button"
                              onClick={handleCancelEditComment}
                              disabled={isSavingCommentEdit}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-400 hover:bg-slate-800 cursor-pointer"
                            >
                              Cancel
                            </button>

                            <button
                              id={`save-edit-comment-btn-${comment._id}`}
                              type="button"
                              onClick={() => handleSaveCommentEdit(comment._id)}
                              disabled={
                                isSavingCommentEdit ||
                                !editCommentText.trim() ||
                                editCommentText.length > 500
                              }
                              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                              {isSavingCommentEdit ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line break-words pl-0.5">
                        {comment.content}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </article>
  )
}
