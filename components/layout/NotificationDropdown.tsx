import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bell, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationManager, Notification } from '../../services/NotificationManager';
import { AuthManager } from '../../services/AuthManager';

const NotificationDropdown: React.FC = () => {
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const user = AuthManager.getCurrentUser();

    const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

    const loadNotifications = async () => {
        if (user?.role) {
            const data = await NotificationManager.getNotifications(user.role);
            setNotifications(data);
        }
    };

    useEffect(() => {
        loadNotifications();

        const handleNewNotif = (e: any) => {
            const newNotif = e.detail;
            setNotifications(prev => [newNotif, ...prev]);
        };

        window.addEventListener('nexus-notification', handleNewNotif);
        return () => window.removeEventListener('nexus-notification', handleNewNotif);
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 transition-all relative rounded-lg ${showNotifications ? 'bg-blue-600/10 text-blue-500' : 'theme-text-muted hover:bg-slate-500/10'}`}
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-blue-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 theme-bg animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showNotifications && (
                <div className="absolute top-full mt-2 right-0 w-80 theme-card border theme-border shadow-2xl rounded-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b theme-border flex items-center justify-between">
                        <div>
                            <h3 className="text-[11px] font-black theme-text uppercase tracking-widest">Notifications</h3>
                            <p className="text-[9px] theme-text-muted font-bold uppercase tracking-widest mt-0.5">{unreadCount} Unread Message{unreadCount !== 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar divide-y theme-border">
                        {notifications.length > 0 ? (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`p-4 flex gap-4 hover:theme-bg/50 transition-colors cursor-pointer ${!n.read ? 'bg-blue-500/5' : 'opacity-60'}`}
                                    onClick={() => {
                                        setShowNotifications(false);
                                        navigate('/activity');
                                    }}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? 'bg-blue-500/10 text-blue-500' : 'theme-bg theme-text-muted border theme-border'}`}>
                                        <Bell size={14} />
                                    </div>
                                    <div className="min-w-0 pr-2">
                                        <p className="text-[11px] font-black theme-text uppercase tracking-tight truncate">{n.title}</p>
                                        <p className="text-[11px] theme-text-muted font-medium line-clamp-2 mt-0.5 leading-snug">{n.message}</p>
                                        <div className="flex items-center gap-1.5 mt-2 text-[8px] font-black theme-text-muted uppercase tracking-widest">
                                            <Clock size={10} /> {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    {!n.read && (
                                        <div className="shrink-0 pt-1">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-10 flex flex-col items-center justify-center theme-text-muted opacity-40">
                                <Bell size={32} className="mb-3" />
                                <p className="text-[10px] font-black uppercase tracking-widest">No notifications</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setShowNotifications(false);
                            navigate('/activity');
                        }}
                        className="w-full p-4 theme-bg border-t theme-border text-[10px] font-black theme-text uppercase tracking-[0.2em] hover:bg-slate-500/5 transition-all text-center block"
                    >
                        See all Notifications
                    </button>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
