export function Logo() {
  return (
    <span className="flex items-center gap-2 text-2xl font-bold tracking-tight">
      <svg width="31" height="31" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="1.8">
          <path d="M16 16C5 16 4 3 10 3c5 0 6 8 6 13ZM16 16c0-11 13-12 13-6 0 5-8 6-13 6ZM16 16c11 0 12 13 6 13-5 0-6-8-6-13ZM16 16c0 11-13 12-13 6 0-5 8-6 13-6Z" />
        </g>
      </svg>
      Flowka<span className="text-primary">.</span>
    </span>
  );
}
