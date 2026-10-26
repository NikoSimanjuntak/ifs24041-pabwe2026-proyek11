/** Kontrol pilihan tunggal berbentuk tombol segmen. options: [[value, label], ...] */
export default function Segmented({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap rounded-lg border border-line bg-white p-1">
      {options.map(([val, text]) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          aria-pressed={value === val}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${value === val ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink'}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
