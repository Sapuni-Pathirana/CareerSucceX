interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  theme?: 'light' | 'dark';
}

export default function ErrorAlert({ message, onDismiss, theme = 'light' }: ErrorAlertProps) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3 animate-scale-in ${
        isDark
          ? 'border border-red-500/30 bg-red-500/10'
          : 'border border-red-200 bg-red-50 shadow-sm'
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isDark ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-600'
        }`}
      >
        !
      </span>
      <p className={`flex-1 text-sm ${isDark ? 'text-red-200' : 'text-red-700'}`}>{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={`shrink-0 transition-colors ${
            isDark ? 'text-red-300 hover:text-red-100' : 'text-red-400 hover:text-red-600'
          }`}
          aria-label="Dismiss"
        >
          ✕
        </button>
      )}
    </div>
  );
}
