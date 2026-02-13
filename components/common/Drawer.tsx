import React, { useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({
    isOpen,
    onClose,
    title,
    children,
    width = 'max-w-2xl',
    isFullscreen = false,
    onToggleFullscreen
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Drawer Content */}
            <div
                className={`relative h-full theme-bg border-l theme-border shadow-2xl transform transition-all duration-300 ease-in-out flex flex-col ${isFullscreen ? 'w-screen' : width} animate-in slide-in-from-right duration-300`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b theme-border bg-opacity-50">
                    <h2 className="text-xl font-black theme-text uppercase tracking-tight">{title}</h2>
                    <div className="flex items-center gap-2">
                        {onToggleFullscreen && (
                            <button
                                onClick={onToggleFullscreen}
                                className="p-2 theme-text-muted hover:theme-text hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title={isFullscreen ? "Minimize" : "Maximize"}
                            >
                                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 theme-text-muted hover:theme-text hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};
