import { FiCheck } from 'react-icons/fi';

export default function Logo({ light = false }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white">
        <FiCheck aria-hidden="true" className="h-5 w-5" strokeWidth={3} />
      </span>
      <span className={`font-display text-lg font-extrabold ${light ? 'text-white' : 'text-ink'}`}>
        Intern<span className="text-accent">Track</span>
      </span>
    </span>
  );
}
