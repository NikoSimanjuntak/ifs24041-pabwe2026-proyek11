const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

/** Avatar berisi inisial nama pengguna. */
export default function Avatar({ name, size = 'h-10 w-10', className = '' }) {
  return (
    <span
      aria-label={name}
      className={`${size} ${className} inline-flex shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white`}
    >
      {initials(name)}
    </span>
  );
}
