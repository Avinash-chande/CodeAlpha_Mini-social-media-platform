import { useEffect, useState } from 'react';
import { Activity, RefreshCw, CheckCircle, XCircle, Clock, Server, Database } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function HealthStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responseTime, setResponseTime] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-400" />
            Backend API Health Monitor
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time diagnostics from <code className="text-xs bg-slate-800 px-2 py-0.5 rounded text-indigo-300">/api/health</code>
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/20"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Probe
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Service Status</span>
            {data?.status === 'ok' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <p className="text-2xl font-bold text-white mt-2 capitalize">
            {loading ? 'Checking...' : data?.status || 'Unavailable'}
          </p>
          <p className="text-xs text-slate-500 mt-1">HTTP 200 OK Response</p>
        </div>

        {/* Database */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">MongoDB</span>
            <Database className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2 capitalize">
            {loading ? 'Probing...' : data?.database?.status || 'Unknown'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Host: {data?.database?.host || '127.0.0.1'}</p>
        </div>

        {/* Latency */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Latency</span>
            <Clock className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {loading ? 'Measuring...' : responseTime !== null ? `${responseTime} ms` : 'N/A'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Server Uptime: {data?.uptime || 'N/A'}</p>
        </div>
      </div>

      {/* Raw Payload Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          Response Payload
        </h2>
        {error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            Failed to query API: {error}
          </div>
        ) : (
          <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-indigo-300 overflow-x-auto border border-slate-800">
            {loading ? 'Fetching payload...' : JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
