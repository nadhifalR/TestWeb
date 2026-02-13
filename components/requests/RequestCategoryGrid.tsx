import React from 'react';

interface RequestCategoryGridProps {
    onSelect: (category: string) => void;
    isDrawerMode?: boolean;
    isFullscreen?: boolean;
}

export const RequestCategoryGrid: React.FC<RequestCategoryGridProps> = ({
    onSelect,
    isDrawerMode = false,
    isFullscreen = false
}) => {
    const categories = [
        { name: 'Brand', icon: '🎨' },
        { name: 'Production', icon: '⚙️' },
        { name: 'Activation', icon: '⚡' },
        { name: 'Entertainment', icon: '🎭' },
        { name: 'Logistics', icon: '📦' },
    ];

    // Responsive Logic:
    // - Default (Page Mode): grid-cols-1 sm:2 lg:5
    // - Drawer Minimized: grid-cols-2 (Constraint)
    // - Drawer Fullscreen: grid-cols-1 sm:2 lg:5 (Wide)
    const gridClass = isDrawerMode && !isFullscreen
        ? "grid grid-cols-2 gap-4 py-6 animate-in fade-in duration-300"
        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 py-6 animate-in fade-in duration-300";

    return (
        <div className={gridClass}>
            {categories.map((cat) => (
                <button
                    key={cat.name}
                    onClick={() => onSelect(cat.name)}
                    className="theme-card p-10 rounded-lg border theme-border hover:border-slate-900 transition-all text-center group active:scale-95"
                >
                    <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all group-hover:scale-110">{cat.icon}</div>
                    <h3 className="font-bold theme-text text-[13px] uppercase tracking-wider">{cat.name}</h3>
                </button>
            ))}
        </div>
    );
};
