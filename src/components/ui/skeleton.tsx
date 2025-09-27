import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
};

export { Skeleton };

// Shimmer effect component
export const Shimmer = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r",
        "before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
      {...props}
    />
  );
};

// Card skeleton for marketplace
export const CardSkeleton = () => {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-[80px]" />
        <Skeleton className="h-8 w-[100px]" />
      </div>
    </div>
  );
};

// Leaderboard skeleton
export const LeaderboardSkeleton = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 rounded-lg border bg-card">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-3 w-[100px]" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-3 w-[40px]" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Profile skeleton
export const ProfileSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border bg-card space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-8 w-[60px]" />
          </div>
        ))}
      </div>
    </div>
  );
};
