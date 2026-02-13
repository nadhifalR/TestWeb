import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    message?: string;
    fullPage?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message = "Loading Data...",
    fullPage = true
}) => {
    return (
        <div className={`${fullPage ? 'h-[80vh]' : 'h-full w-full py-12'} flex flex-col items-center justify-center gap-4 theme-text-muted`}>
            <div className="relative">
                <Loader2 className="animate-spin text-blue-500" size={48} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
                {message}
            </p>
        </div>
    );
};
