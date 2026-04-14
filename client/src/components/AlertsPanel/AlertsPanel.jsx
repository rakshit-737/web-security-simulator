import React, { useState, useEffect } from 'react';
import { logsAPI } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { formatTimestamp, getLevelColor } from '../../utils/formatters';

function AlertCard({ alert }) {
  const isNew = Date.now() - new Date(alert.timestamp || alert.createdAt).getTime() < 10000;
  return (
    <div className={`p-3 rounded-lg border transition-all ${
      alert.level === 'critical'
        ? 'bg-red-950/60 border-red-800'
        : 'bg-yellow-950/60 border-yellow-800'
    } ${isNew ? 'ring-1 ring-offset-0 ring-blue-500/50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={getLevelColor(alert.level)}>
            {alert.level}
          </span>
          {alert.type && (
            <span className="badge-neutral text-[10px]">{alert.type}</span>
          )}
        </div>
        <span className="text-gray-500 text-[10px] whitespace-nowrap shrink-0">
          {formatTimestamp(alert.timestamp || alert.createdAt)}
        </span>
      </div>
      <p className="mt-1.5 text-sm text-gray-300 leading-snug">{alert.message}</p>
    </div>
  );
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socketAlerts] = useSocket('new_alert', 50);

  useEffect(() => {
    async function fetchAlerts() {
      setLoading(true);
      try {
        const res = await logsAPI.getAlerts();
        setAlerts(res.data.slice(0, 50));
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, []);

  // Merge real-time alerts
  useEffect(() => {
    if (socketAlerts.length > 0) {
      setAlerts((prev) => {
        const existingIds = new Set(prev.map((a) => a._id));
        const fresh = socketAlerts.filter((a) => !existingIds.has(a._id));
        const merged = [...fresh, ...prev];
        return merged.slice(0, 50);
      });
    }
  }, [socketAlerts]);

  const criticalCount = alerts.filter((a) => a.level === 'critical').length;
  const warningCount = alerts.filter((a) => a.level === 'warning').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
            Alerts
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {criticalCount > 0 && (
            <span className="badge-critical">{criticalCount} critical</span>
          )}
          {warningCount > 0 && (
            <span className="badge-warning">{warningCount} warning</span>
          )}
          {alerts.length === 0 && !loading && (
            <span className="badge-success">All clear</span>
          )}
        </div>
      </div>

      {/* Alerts list */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
        {loading ? (
          <div className="flex items-center justify-center h-24 text-gray-500 text-sm">
            <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading alerts…
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <svg className="w-8 h-8 mb-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm">No active alerts</span>
          </div>
        ) : (
          alerts.map((alert, idx) => (
            <AlertCard key={alert._id || idx} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
}
