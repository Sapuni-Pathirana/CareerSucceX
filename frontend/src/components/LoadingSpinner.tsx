interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

export default function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-brand-200 border-t-brand-600`}
        role="status"
        aria-label="Loading"
      />
      {label && <p className="text-sm font-medium text-[#7aaea9] animate-pulse">{label}</p>}
    </div>
  );
}
