import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { postAPI } from '../services/api'
import {
  Image as ImageIcon,
  Send,
  Loader2,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react'

const SAMPLE_POST_IMAGES = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
]

export default function CreatePostCard({ onPostCreated }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [image, setImage] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanContent = content.trim()
    if (!cleanContent) {
      setError('Please write something before publishing.')
      return
    }

    if (cleanContent.length > 1000) {
      setError('Post content cannot exceed 1000 characters.')
      return
    }

    try {
      setIsSubmitting(true)
      const data = await postAPI.createPost({
        content: cleanContent,
        image: image.trim(),
      })

      // Reset form
      setContent('')
      setImage('')
      setShowImageInput(false)

      // Notify parent to prepend new post without full page reload
      if (onPostCreated && data.post) {
        onPostCreated(data.post)
      }
    } catch (err) {
      setError(err.message || 'Failed to create post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-xl">
      {/* Top Author Bar */}
      <div className="flex items-center gap-3 mb-4">
        {user?.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={user.username}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
            {user?.username ? user.username[0].toUpperCase() : 'U'}
          </div>
        )}
        <div>
          <div className="font-bold text-sm text-white">@{user?.username}</div>
          <div className="text-[11px] text-slate-400">Share with the community</div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Composer Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            id="post-content-input"
            rows={3}
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              if (error) setError('')
            }}
            placeholder="What's happening? Share an update or thought..."
            maxLength={1000}
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none disabled:opacity-50"
          />
        </div>

        {/* Image URL Input (collapsible) */}
        {showImageInput && (
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <label
                htmlFor="post-image-input"
                className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>Attach Image (URL)</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowImageInput(false)
                  setImage('')
                }}
                className="text-slate-400 hover:text-slate-200 p-1"
                title="Remove image input"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              id="post-image-input"
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            />

            {/* Quick Presets */}
            <div className="flex items-center gap-2 pt-1 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-amber-400" /> Samples:
              </span>
              {SAMPLE_POST_IMAGES.map((sampleUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImage(sampleUrl)}
                  className={`w-9 h-9 rounded-lg overflow-hidden shrink-0 ring-1 cursor-pointer transition-all ${
                    image === sampleUrl
                      ? 'ring-2 ring-blue-500 scale-105'
                      : 'ring-slate-700 hover:ring-slate-500'
                  }`}
                >
                  <img
                    src={sampleUrl}
                    alt={`Sample ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Image Preview */}
            {image && (
              <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-800 max-h-48 bg-black/40 flex items-center justify-center">
                <img
                  src={image}
                  alt="Post preview"
                  className="w-full h-48 object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setImage('')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs cursor-pointer shadow-md"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer controls: Image toggle, Character counter, Submit button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              id="toggle-image-btn"
              type="button"
              onClick={() => setShowImageInput((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                showImageInput
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{showImageInput ? 'Image Added' : 'Add Image'}</span>
            </button>

            <span className="text-[11px] text-slate-500 pl-1">
              {content.length}/1000
            </span>
          </div>

          <button
            id="create-post-submit-btn"
            type="submit"
            disabled={isSubmitting || !content.trim() || content.length > 1000}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
