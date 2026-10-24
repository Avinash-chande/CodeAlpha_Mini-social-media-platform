export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-sm text-slate-500">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>Mini Social Media Platform &bull; Phase 1 Setup & Scaffolding</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 border border-slate-800 text-slate-400">
            React 19 + Vite
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 border border-slate-800 text-slate-400">
            Tailwind CSS v4
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 border border-slate-800 text-slate-400">
            React Router v7
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 border border-slate-800 text-slate-400">
            Node.js + Express
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 border border-slate-800 text-slate-400">
            MongoDB + Mongoose
          </span>
        </div>
      </div>
    </footer>
  );
}
