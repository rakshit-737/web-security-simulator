import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogsViewer from '../components/LogsViewer/LogsViewer';
import AlertsPanel from '../components/AlertsPanel/AlertsPanel';

function RoleBadge({ role }) {
  const cls = {
    admin: 'bg-purple-900 text-purple-200 border border-purple-700',
    analyst: 'bg-blue-900 text-blue-200 border border-blue-700',
    attacker: 'bg-red-900 text-red-200 border border-red-700',
  }[role] || 'bg-gray-700 text-gray-200 border border-gray-600';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {role}
    </span>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top nav */}
      <header className="shrink-0 bg-gray-900 border-b border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="font-bold text-white text-sm tracking-tight">ZT-WSS</span>
            </div>

            {/* Nav tabs */}
            <nav className="flex items-center gap-1">
              <span className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 text-sm font-medium border border-blue-700/50">
                Dashboard
              </span>
              <Link
                to="/simulator"
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                Simulator
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-200 font-medium">{user?.username}</div>
              <div className="flex justify-end mt-0.5">
                <RoleBadge role={user?.role} />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Page body */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left — Logs (60%) */}
        <div className="flex flex-col" style={{ flex: '0 0 60%' }}>
          <div className="card p-4 flex-1 flex flex-col overflow-hidden">
            <LogsViewer />
          </div>
        </div>

        {/* Right — Alerts (40%) */}
        <div className="flex flex-col flex-1">
          <div className="card p-4 flex-1 flex flex-col overflow-hidden">
            <AlertsPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
