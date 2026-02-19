import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
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
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-30" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300 sm:duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300 sm:duration-300"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className={`pointer-events-auto w-screen transform transition-all duration-300 ease-in-out ${isFullscreen ? 'max-w-[calc(100vw-var(--sidebar-width,256px))]' : width}`}>
                                    <div className="flex h-full flex-col theme-bg shadow-xl border-l theme-border">
                                        {/* Header */}
                                        <div className="flex items-center justify-between p-6 border-b theme-border bg-opacity-50">
                                            <Dialog.Title className="text-xl font-black theme-text uppercase tracking-tight">
                                                {title}
                                            </Dialog.Title>
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
                                        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-6">
                                            {children}
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};
