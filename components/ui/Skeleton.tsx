export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-stone-100 rounded-xl ${className ?? ""}`} />
);
