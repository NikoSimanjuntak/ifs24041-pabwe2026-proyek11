export default function EmptyState({ title, description, children }) {
  return (
    <div className="panel px-6 py-14 text-center">
      <p className="font-bold">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
