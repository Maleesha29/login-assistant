import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { AutomationProgressEvent, AutomationStep } from '../types';

interface AutomationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvent: AutomationProgressEvent | null;
  history: AutomationProgressEvent[];
  company: string;
  game: string;
  sheetSource?: string;
}

const STEP_DEFINITIONS: Array<{ key: AutomationStep; label: string }> = [
  { key: 'FINDING_COMPANY', label: 'Find company in Sheet tab' },
  { key: 'FINDING_GAME', label: 'Find game row in Column A' },
  { key: 'ACCOUNT_FOUND', label: 'Retrieve website credentials' },
  { key: 'LAUNCHING_BROWSER', label: 'Launch Chromium browser' },
  { key: 'OPENING_WEBSITE', label: 'Open target website' },
  { key: 'ENTERING_USERNAME', label: 'Fill username credential' },
  { key: 'ENTERING_PASSWORD', label: 'Fill password credential' },
  { key: 'SUBMITTING_LOGIN', label: 'Submit login form' },
  { key: 'LOGIN_COMPLETED', label: 'Login completed' }
];

export const AutomationStatusModal: React.FC<AutomationStatusModalProps> = ({
  isOpen,
  onClose,
  currentEvent,
  history,
  company,
  game,
  sheetSource
}) => {
  if (!isOpen) return null;

  const isError = currentEvent?.step === 'ERROR';
  const isDone = currentEvent?.step === 'LOGIN_COMPLETED';
  const progressPercent = currentEvent?.progressPercent || 0;

  const [countdown, setCountdown] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (isDone) {
      setCountdown(2);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            onClose();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setCountdown(null);
    }
  }, [isDone, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-dark-900 border border-dark-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-dark-700/80 flex items-center justify-between bg-dark-850/60">
          <div className="flex items-center space-x-3">
            <div className={'p-2 rounded-xl ' + (
              isError
                ? 'bg-rose-500/20 text-rose-400'
                : isDone
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-brand-500/20 text-brand-400'
            )}>
              {isError ? (
                <AlertCircle className="w-5 h-5" />
              ) : isDone ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isError ? 'Login Failed' : isDone ? 'Login Successful' : 'Automating Login...'}
              </h3>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
                <span>{company} <span className="text-slate-600">/</span> {game}</span>
                {sheetSource && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {sheetSource}
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-full bg-dark-800 h-1.5">
          <div
            className={'h-full transition-all duration-300 ' + (
              isError ? 'bg-rose-500' : isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-accent-cyan'
            )}
            style={{ width: progressPercent + '%' }}
          />
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className={'p-4 rounded-xl border flex items-start space-x-3 ' + (
            isError
              ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
              : isDone
              ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
              : 'bg-brand-950/30 border-brand-800/50 text-brand-200'
          )}>
            {isError ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : isDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Loader2 className="w-5 h-5 text-brand-400 animate-spin shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-sm font-semibold">
                {currentEvent?.message || 'Processing...'}
              </div>
              {isDone && (
                <div className="text-xs text-emerald-300/80 mt-1">
                  The Chromium browser window remains open for you to play or use the site.
                </div>
              )}
              {isError && currentEvent?.error && (
                <div className="text-xs text-rose-300/80 mt-1 font-mono">
                  {currentEvent.error}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Step Progression
            </h4>
            <div className="space-y-1.5">
              {STEP_DEFINITIONS.map((stepDef, idx) => {
                const hasReached = history.some((h) => h.step === stepDef.key) || (isDone && idx <= 8);
                const isCurrent = currentEvent?.step === stepDef.key;

                return (
                  <div
                    key={stepDef.key}
                    className={'flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ' + (
                      isCurrent
                        ? 'bg-dark-800 text-white border border-brand-500/40'
                        : hasReached
                        ? 'text-slate-300'
                        : 'text-slate-600'
                    )}
                  >
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      {isCurrent && !isDone && !isError ? (
                        <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                      ) : hasReached ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-dark-700" />
                      )}
                    </div>
                    <span className="flex-1">{stepDef.label}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Step {idx + 1}/9
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-dark-850 border-t border-dark-700/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {isDone
              ? countdown !== null
                ? `Auto-closing in ${countdown}s...`
                : 'Closing dialog...'
              : 'Automated with Playwright'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-200 text-xs font-semibold transition"
          >
            {isDone ? `Close (${countdown ?? 2}s)` : isError ? 'Close' : 'Hide Dialog'}
          </button>
        </div>
      </div>
    </div>
  );
};
