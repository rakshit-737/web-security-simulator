import React, { useState, useEffect, useRef, useCallback } from 'react';
import { logsAPI } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { formatTimestamp, getLevelColor } from '../../utils/formatters';

const LEVELS = ['all', 'info', 'warning', 'critical'];

function LevelBadge({ level }) {
  return <span className={getLevelColor(level)}>{level}</span>;
}

function BlockedBadge({ blocked }) {
  if (blocked === true)
    return <span className="badge bg-red-900 text-red-300 border border-red-700">Blocked</span>;
  if (blocked === false)
    return <span className="badge bg-gray-700 text-gray-400 border border-gray-600">Passed</span>;
  return null;
}

export default function LogsViewer() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterLevel, setFilterLevel] = useState('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [socketLogs] = useSocket('new_log', 200);
  const bottomRef = useRef(null);

  const fetchLogs = useCallback(async (page = 1, append = false) => {
    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const res = await logsAPI.getLogs(page, 20);
      const { logs: newLogs, pagination: pg } = res.data;
      setLogs((prev) => (append ? [...prev, ...newLogs] : newLogs));
      setPagination(pg);
    } catch {
      // silently fail — logs are non-critical
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(1, false);
  }, [fetchLogs]);

  // Prepend real-time socket logs
  useEffect(() => {
    if (socketLogs.length > 0) {
      setLogs((prev) => {
        const existingIds = new Set(prev.map((l) => l._id));
        const fresh = socketLogs.filter((l) => !existingIds.has(l._id));
        return [...fresh, ...prev].slice(0, 500);
      });
    }
  }, [socketLogs]);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filtered = filterLevel === 'all'
    ? logs
    : logs.filter((l) => l.level === filterLevel);

  function loadMore() {
    if (pagination.page < pagination.pages) {
      fetchLogs(pagination.page + 1, true);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
            Live Logs
          </h2>
          <span className="badge-neutral ml-1">{pagination.total} total</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Level filter */}
          <div className="flex gap-1">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  filterLevel === lvl
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll((v) => !v)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
              autoScroll ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-400'
            }`}
            title="Toggle auto-scroll"
          >
            ↓ Auto
          </button>
          {/* Refresh */}
          <button
            onClick={() => fetchLogs(1, false)}
            className="p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            title="Refresh logs"
            disabled={loading}
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-gray-700 bg-gray-900 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading logs…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            No logs found
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-gray-800 z-10">
              <tr className="border-b border-gray-700">
                <th className="text-left px-3 py-2 text-gray-400 font-semibold whitespace-nowrap">Time</th>
                <th className="text-left px-3 py-2 text-gray-400 font-semibold">Method</th>
                <th className="text-left px-3 py-2 text-gray-400 font-semibold">Path</th>
                <th className="text-left px-3 py-2 text-gray-400 font-semibold">Level</th>
                <th className="text-left px-3 py-2 text-gray-400 font-semibold">Source IP</th>
                <th className="text-left px-3 py-2 text-gray-400 font-semibold">Flags</th>
                <th className="text-left px-3 py-2 text-gray-400 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, idx) => (
                <tr
                  key={log._id || idx}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap font-mono">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-3 py-1.5">
                    {log.method && (
                      <span className={`font-mono font-bold text-xs ${
                        log.method === 'GET' ? 'text-green-400' :
                        log.method === 'POST' ? 'text-blue-400' :
                        log.method === 'PUT' ? 'text-yellow-400' :
                        log.method === 'DELETE' ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {log.method}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-gray-300 font-mono max-w-[180px] truncate" title={log.path}>
                    {log.path || '—'}
                  </td>
                  <td className="px-3 py-1.5">
                    <LevelBadge level={log.level || 'info'} />
                  </td>
                  <td className="px-3 py-1.5 text-gray-400 font-mono">{log.source || '—'}</td>
                  <td className="px-3 py-1.5">
                    {log.detectionFlags?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {log.detectionFlags.map((flag, i) => (
                          <span key={i} className="badge bg-orange-900 text-orange-300 border border-orange-700 text-[10px]">
                            {flag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <BlockedBadge blocked={log.blocked} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Load more */}
      {!loading && pagination.page < pagination.pages && (
        <div className="mt-2 text-center shrink-0">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            {loadingMore ? 'Loading…' : `Load more (${pagination.total - filtered.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
