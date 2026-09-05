import { SkeletonCards, SkeletonProfileHeader } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonProfileHeader />
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SkeletonCards count={3} as="div" />
      </dl>
    </div>
  );
}
