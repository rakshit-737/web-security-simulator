import React, { useState, useEffect, useCallback } from 'react';
import { defenseAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DEFENSE_META = [
  {
    key: 'rateLimiting',
    label: 'Rate Limiting',
    description: 'Throttles excessive requests to prevent brute-force and DDoS attacks.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'inputSanitization',
    label: 'Input Sanitization',
    description: 'Strips or encodes dangerous characters from user-supplied data.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
      </svg>
    ),
  },
  {
    key: 'cspEnabled',
    label: 'CSP Headers',
    description: 'Content Security Policy headers mitigate XSS by restricting resource origins.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    key: 'wafEnabled',
    label: 'WAF Rules',
    description: 'Web Application Firewall blocks requests matching known attack patterns.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM10 9v2m0 4h.01" />
      </svg>
    ),
  },
];

function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => !disabled && onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
        enabled ? 'bg-blue-600' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function DefensePanel() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [config, setConfig] = useState({
    rateLimiting: true,
    inputSanitization: true,
    cspEnabled: true,
    wafEnabled: true,
  });
  const [draft, setDraft] = useState({ ...config });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await defenseAPI.get();
      const cfg = {
        rateLimiting: res.data.rateLimiting,
        inputSanitization: res.data.inputSanitization,
        cspEnabled: res.data.cspEnabled,
        wafEnabled: res.data.wafEnabled,
      };
      setConfig(cfg);
      setDraft(cfg);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load defense configuration.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    const changed = Object.keys(draft).some((k) => draft[k] !== config[k]);
    setHasChanges(changed);
  }, [draft, config]);

  function handleToggle(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleApply() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await defenseAPI.update(draft);
      const updated = {
        rateLimiting: res.data.config.rateLimiting,
        inputSanitization: res.data.config.inputSanitization,
        cspEnabled: res.data.config.cspEnabled,
        wafEnabled: res.data.config.wafEnabled,
      };
      setConfig(updated);
      setDraft(updated);
      setMessage({ type: 'success', text: 'Defense configuration updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update configuration.' });
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setDraft({ ...config });
    setMessage(null);
  }

  const enabledCount = Object.values(draft).filter(Boolean).length;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${enabledCount >= 3 ? 'bg-green-500' : enabledCount >= 2 ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Defense Controls</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`badge text-[10px] ${
            enabledCount === 4 ? 'badge-success' :
            enabledCount >= 2 ? 'badge-warning' :
            'badge-critical'
          }`}>
            {enabledCount}/4 active
          </span>
          {!isAdmin && (
            <span className="badge-neutral text-[10px]">read-only</span>
          )}
        </div>
      </div>

      {/* Security posture bar */}
      <div className="shrink-0">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Security Posture</span>
          <span>{Math.round((enabledCount / 4) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              enabledCount === 4 ? 'bg-green-500' :
              enabledCount >= 2 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${(enabledCount / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-gray-500">
          <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading configuration…
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
          {DEFENSE_META.map((def) => (
            <div
              key={def.key}
              className={`p-4 rounded-xl border transition-all ${
                draft[def.key]
                  ? 'bg-blue-950/40 border-blue-800'
                  : 'bg-gray-800/60 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${draft[def.key] ? 'text-blue-400' : 'text-gray-500'}`}>
                    {def.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-200">{def.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5 leading-relaxed max-w-xs">
                      {def.description}
                    </div>
                  </div>
                </div>
                <Toggle
                  enabled={draft[def.key]}
                  onChange={(val) => handleToggle(def.key, val)}
                  disabled={!isAdmin}
                />
              </div>
              {!draft[def.key] && (
                <div className="mt-2 text-xs text-yellow-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  This defense is disabled — system is vulnerable
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`shrink-0 p-3 rounded-lg border text-sm flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-900/40 border-green-700 text-green-300'
            : 'bg-red-900/40 border-red-700 text-red-300'
        }`}>
          {message.type === 'success' ? (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      {/* Admin buttons */}
      {isAdmin && !loading && (
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleApply}
            disabled={saving || !hasChanges}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving…
              </>
            ) : (
              'Apply Changes'
            )}
          </button>
          {hasChanges && (
            <button
              onClick={handleDiscard}
              className="btn-secondary text-sm px-3"
            >
              Discard
            </button>
          )}
        </div>
      )}
    </div>
  );
}
