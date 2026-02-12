"use client";

export function CardSkeleton() {
    return (
        <div className="glass-card rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="shimmer h-11 w-11 rounded-xl" />
                <div className="shimmer h-6 w-16 rounded-lg" />
            </div>
            <div className="shimmer h-8 w-24 rounded-lg mb-2" />
            <div className="shimmer h-4 w-32 rounded-lg" />
        </div>
    );
}

export function AttackCardSkeleton() {
    return (
        <div className="glass-card rounded-2xl overflow-hidden">
            <div className="shimmer h-1 w-full" />
            <div className="p-6">
                <div className="flex justify-between mb-3">
                    <div className="shimmer h-6 w-3/4 rounded-lg" />
                    <div className="shimmer h-5 w-20 rounded-lg" />
                </div>
                <div className="space-y-2 mb-4">
                    <div className="shimmer h-4 w-full rounded" />
                    <div className="shimmer h-4 w-5/6 rounded" />
                    <div className="shimmer h-4 w-2/3 rounded" />
                </div>
                <div className="flex gap-3 mb-4">
                    <div className="shimmer h-4 w-28 rounded" />
                    <div className="shimmer h-4 w-24 rounded" />
                    <div className="shimmer h-4 w-20 rounded" />
                </div>
                <div className="flex gap-2">
                    <div className="shimmer h-6 w-16 rounded-lg" />
                    <div className="shimmer h-6 w-16 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="glass-card rounded-2xl p-6">
            <div className="shimmer h-5 w-40 rounded-lg mb-6" />
            <div className="flex items-end gap-2 h-48">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div
                            className="shimmer w-full max-w-[40px] rounded-t-lg"
                            style={{ height: `${30 + Math.random() * 50}%` }}
                        />
                        <div className="shimmer h-3 w-8 mt-2 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
