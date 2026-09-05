import { SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="border-b-2 border-accent pb-4 text-3xl font-bold uppercase tracking-tight text-foreground">
        Ao Vivo
      </h1>
      <div className="border-l-4 border-line bg-surface p-5">
        <SkeletonBlock className="h-4 w-56" />
        <SkeletonBlock className="mt-2 h-4 w-72 max-w-full" />
      </div>
    </div>
  );
}
