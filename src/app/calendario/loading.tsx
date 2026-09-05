import { SkeletonCards } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="border-b-2 border-accent pb-4 text-3xl font-bold uppercase tracking-tight text-foreground">
        Calendário
      </h1>
      <ol className="flex flex-col gap-3">
        <SkeletonCards count={6} />
      </ol>
    </div>
  );
}
