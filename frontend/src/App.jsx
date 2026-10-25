import { BrowserRouter, Routes, Route } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 text-blue-500 font-bold text-xl mb-2">
          M
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Mini Social Media Platform</h1>
        <p className="text-sm text-slate-400">
          Phase 1 Setup: React + Vite + Tailwind CSS v4 + React Router
        </p>
        <div className="pt-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Frontend Ready
          </span>
        </div>
      </div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-red-500">404</h1>
        <p className="text-slate-400">Page not found</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
