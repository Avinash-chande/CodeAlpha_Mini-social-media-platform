import { useEffect, useState } from 'react';
import { Database, Server, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Layers, Users, FileText, MessageSquare } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Home() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setHealthData(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-12 pb-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          Phase 1: Project Setup & Architecture
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          Mini Social Media Platform
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400">
          Clean full-stack foundation configured with React, Tailwind CSS v4, Express, and MongoDB Mongoose models with validation & password hashing.
        </p>
      </section>

      {/* Backend & Database Live Status Card */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              Live Server & Database Connectivity
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Real-time probe connecting frontend to <code className="text-xs bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">GET /api/health</code>
            </p>
          </div>
          <button
            onClick={checkHealth}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Re-test Health
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* API Status */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
            ) : healthData ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-8 h-8 text-rose-400 shrink-0" />
            )}
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Express API</p>
              <p className="text-base font-semibold text-white mt-0.5">
                {loading ? 'Testing...' : healthData ? 'Online & Healthy' : 'Offline / Error'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Port: 5000 (CORS + JSON enabled)</p>
            </div>
          </div>

          {/* Database Status */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
            {loading ? (
              <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
            ) : healthData?.database?.status === 'connected' ? (
              <Database className="w-8 h-8 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-8 h-8 text-rose-400 shrink-0" />
            )}
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">MongoDB Database</p>
              <p className="text-base font-semibold text-white mt-0.5">
                {loading ? 'Checking...' : healthData?.database?.status === 'connected' ? 'Connected (Mongoose)' : 'Not Connected'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                DB: {healthData?.database?.name || 'mini_social_media'}
              </p>
            </div>
          </div>

          {/* Security & Validation */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs font-medium uppercase text-slate-400">Security Architecture</p>
              <p className="text-base font-semibold text-white mt-0.5">Bcrypt Password Hashing</p>
              <p className="text-xs text-slate-500 mt-1">Unique indexes & safe JSON exclusion</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Connection note: {error}. Ensure backend is running via <code>npm run dev</code> in backend folder.</span>
          </div>
        )}
      </section>

      {/* Mongoose Data Models Section */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Phase 1 Database Architecture</h2>
          <p className="text-sm text-slate-400 mt-1">
            Mongoose Schemas with ObjectId cross-references, field validations, and pre-save hooks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Model Card */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">User Model</h3>
                <span className="text-xs text-slate-400 font-mono">models/User.js</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="font-mono text-indigo-300">username</span>
                <span className="text-slate-400">String (unique, required, trim)</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="font-mono text-indigo-300">email</span>
                <span className="text-slate-400">String (unique, required, regex)</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="font-mono text-indigo-300">password</span>
                <span className="text-slate-400">Bcrypt Hashed (pre-save)</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="font-mono text-indigo-300">bio / avatar</span>
                <span className="text-slate-400">String (defaults applied)</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="font-mono text-indigo-300">followers</span>
                <span className="text-slate-400">[ObjectId &rarr; User]</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="font-mono text-indigo-300">following</span>
                <span className="text-slate-400">[ObjectId &rarr; User]</span>
              </li>
              <li className="flex items-center justify-between py-1">
                <span className="font-mono text-indigo-300">timestamps</span>
                <span className="text-slate-400">createdAt & updatedAt</span>
              </li>
            </ul>
          </div>

          {/* Post Model Card */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Post Model</h3>
                <span className="text-xs text-slate-400 font-mono">models/Post.js</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="font-mono text-violet-300">author</span>
                <span className="text-slate-400">ObjectId -&gt; User (required)</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="font-mono text-violet-300">content</span>
                <span className="text-slate-400">String (required, max 1000)</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="font-mono text-violet-300">likes</span>
                <span className="text-slate-400">[ObjectId -&gt; User]</span>
              </li>
              <li className="flex items-center justify-between py-1">
                <span className="font-mono text-violet-300">timestamps</span>
                <span className="text-slate-400">createdAt & updatedAt</span>
              </li>
            </ul>
          </div>

          {/* Comment Model Card */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Comment Model</h3>
                <span className="text-xs text-slate-400 font-mono">models/Comment.js</span>
              </div>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="font-mono text-amber-300">post</span>
                <span className="text-slate-400">ObjectId -&gt; Post (required)</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="font-mono text-amber-300">author</span>
                <span className="text-slate-400">ObjectId -&gt; User (required)</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-slate-800/80">
                <span className="font-mono text-amber-300">content</span>
                <span className="text-slate-400">String (required, max 500)</span>
              </li>
              <li className="flex items-center justify-between py-1">
                <span className="font-mono text-amber-300">timestamps</span>
                <span className="text-slate-400">createdAt & updatedAt</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
