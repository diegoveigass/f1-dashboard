import { SkeletonCards } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="border-b-2 border-accent pb-4 text-3xl font-bold uppercase tracking-tight text-foreground">
        Circuitos
      </h1>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SkeletonCards count={6} />
      </ul>
    </div>
  );
}
