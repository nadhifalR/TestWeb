import React from 'react';

interface SkeletonCardProps {
    className?: string;
    height?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
    className = "",
    height = "h-32"
}) => {
    return (
        <div className={`theme-card rounded-lg border theme-border overflow-hidden relative ${className}`}>
            <div className={`w-full ${height} bg-slate-200/50 dark:bg-slate-800/50 animate-pulse relative`}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
        </div>
    );
};
