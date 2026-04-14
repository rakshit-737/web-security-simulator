import React, { useState, useEffect } from 'react';
import { attackAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatTimestamp, getAttackTypeLabel, getResultBadge } from '../../utils/formatters';

const ATTACK_TYPES = [
  { value: 'sqli', label: 'SQL Injection', example: "' OR 1=1 --" },
  { value: 'xss', label: 'XSS (Reflected)', example: '<script>alert("XSS")</script>' },
  { value: 'brute-force', label: 'Brute Force', example: '' },
  { value: 'csrf', label: 'CSRF', example: '' },
];

function ResultCard({ result }) {
  if (!result) return null;
  const badge = getResultBadge(result);

  const borderColor = result.detected && result.blocked
    ? 'border-red-700 bg-red-950/40'
    : result.detected
    ? 'border-yellow-700 bg-yellow-950/40'
    : 'border-green-700 bg-green-950/40';

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${borderColor}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-200">Simulation Result</span>
        <span className={badge.cls}>{badge.text}</span>
      </div>

      <div className="text-sm text-gray-300 leading-relaxed">
        {result.message}
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 rounded bg-gray-800/60">
          <div className="text-gray-400 mb-0.5">Detected</div>
          <div className={result.detected ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
            {result.detected ? 'YES' : 'NO'}
          </div>
        </div>
        <div className="text-center p-2 rounded bg-gray-800/60">
          <div className="text-gray-400 mb-0.5">Blocked</div>
          <div className={result.blocked ? 'text-red-400 font-bold' : 'text-gray-400 font-bold'}>
            {result.blocked ? 'YES' : 'NO'}
          </div>
        </div>
        <div className="text-center p-2 rounded bg-gray-800/60">
          <div className="text-gray-400 mb-0.5">Sanitized</div>
          <div className={result.sanitized ? 'text-yellow-400 font-bold' : 'text-gray-400 font-bold'}>
            {result.sanitized ? 'YES' : 'NO'}
          </div>
        </div>
      </div>

      {result.sanitizedPayload && result.sanitizedPayload !== result.rawPayload && (
        <div className="space-y-1">
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Payload Comparison</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] text-gray-500 mb-1">Raw</div>
              <code className="block text-xs bg-gray-900 rounded p-2 text-red-300 break-all font-mono">
                {result.rawPayload || '—'}
              </code>
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-1">Sanitized</div>
              <code className="block text-xs bg-gray-900 rounded p-2 text-green-300 break-all font-mono">
                {result.sanitizedPayload}
              </code>
            </div>
          </div>
        </div>
      )}

      {result.detectionFlags?.length > 0 && (
        <div>
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Detection Flags</div>
          <div className="flex flex-wrap gap-1">
            {result.detectionFlags.map((f, i) => (
              <span key={i} className="badge bg-orange-900 text-orange-300 border border-orange-700 text-[10px]">{f}</span>
            ))}
          </div>
        </div>
      )}

      {result.attempts !== undefined && (
        <div className="text-xs text-gray-400">
          Attempts simulated: <span className="text-gray-200 font-semibold">{result.attempts}</span>
        </div>
      )}
    </div>
  );
}

export default function AttackPanel() {
  const { user } = useAuth();
  const [attackType, setAttackType] = useState('sqli');
  const [payload, setPayload] = useState(ATTACK_TYPES[0].example);
  const [attempts, setAttempts] = useState(10);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const found = ATTACK_TYPES.find((t) => t.value === attackType);
    if (found) setPayload(found.example);
    setResult(null);
    setError('');
  }, [attackType]);

  async function handleSimulate() {
    setError('');
    setLoading(true);
    try {
      const options = attackType === 'brute-force' ? { attempts } : {};
      const res = await attackAPI.simulate(attackType, payload || null, options);
      setResult(res.data.result);
    } catch (err) {
      setError(err.response?.data?.error || 'Simulation failed.');
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await attackAPI.getHistory();
      setHistory(res.data);
      setShowHistory(true);
    } catch {
      setError('Failed to load history.');
    }
  }

  if (!user || (user.role !== 'attacker' && user.role !== 'admin')) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
        <svg className="w-12 h-12 mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-sm">Attack simulation requires <strong className="text-gray-400">attacker</strong> or <strong className="text-gray-400">admin</strong> role.</p>
        <p className="text-xs mt-1 text-gray-600">Your role: <span className="text-gray-400">{user?.role}</span></p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">Attack Simulation</h2>
        </div>
        <button
          onClick={showHistory ? () => setShowHistory(false) : loadHistory}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showHistory ? '← Back' : 'History →'}
        </button>
      </div>

      {showHistory ? (
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No history yet.</p>
          ) : (
            history.map((h, i) => {
              const badge = getResultBadge(h.result);
              return (
                <div key={h._id || i} className="p-3 rounded-lg bg-gray-800 border border-gray-700 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-200">{getAttackTypeLabel(h.type)}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={badge.cls}>{badge.text}</span>
                      <span className="text-gray-500">{formatTimestamp(h.timestamp)}</span>
                    </div>
                  </div>
                  {h.payload && (
                    <code className="block text-gray-400 font-mono truncate">{h.payload}</code>
                  )}
                  {h.result?.message && (
                    <p className="text-gray-500">{h.result.message}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
          {/* Attack Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Attack Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ATTACK_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setAttackType(t.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
                    attackType === t.value
                      ? 'bg-red-900/60 border-red-600 text-red-200'
                      : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payload */}
          {(attackType === 'sqli' || attackType === 'xss') && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Payload
              </label>
              <textarea
                className="input-field font-mono text-sm resize-none"
                rows={4}
                placeholder="Enter attack payload…"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
              />
            </div>
          )}

          {/* Brute force options */}
          {attackType === 'brute-force' && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Attempts Count
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                className="input-field w-32"
                value={attempts}
                onChange={(e) => setAttempts(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">Number of credential attempts to simulate.</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Run button */}
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="btn-danger w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run Simulation
              </>
            )}
          </button>

          {/* Result */}
          {result && <ResultCard result={result} type={attackType} />}
        </div>
      )}
    </div>
  );
}
