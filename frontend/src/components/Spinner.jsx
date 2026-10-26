export default function Spinner({ label = 'Memuat…', className = '' }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-3 py-16 text-ink-soft ${className}`}>
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
