export default function Loading() {
  return (
    <div className="grid animate-pulse gap-4" aria-busy="true">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
