export default function Loading() {
  return (
    <div className="grid animate-pulse grid-cols-2 gap-4 md:grid-cols-4" aria-busy="true">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i}>
          <div className="aspect-[4/5] rounded-2xl bg-muted" />
          <div className="mt-3 h-5 w-3/4 rounded bg-muted" />
          <div className="mt-3 h-10 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
