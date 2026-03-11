
import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

interface ProfileProps {
    session: Session;
}

const Profile: React.FC<ProfileProps> = ({ session }) => {
    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const user = session.user;
    const userInitial = user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'P';
    const userName = user?.user_metadata?.full_name || 'Praxis User';
    const userEmail = user?.email || 'No email provided';

    return (
        <div className="flex flex-col h-full">
            <header className="px-6 pt-6 pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Profile</h1>
            </header>
            <main className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
                <div className="flex flex-col items-center mt-6 mb-10">
                    <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-background text-6xl font-bold shadow-2xl shadow-primary/20 mb-6 border-4 border-surface">
                        {userInitial}
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">{userName}</h2>
                    <p className="text-zinc-600 dark:text-zinc-500 font-medium">{userEmail}</p>
                </div>

                <div className="space-y-3">
                     <Link to="/profile/personal" className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-border hover:bg-zinc-800 transition-all group">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                           <span className="material-symbols-outlined">person</span>
                        </div>
                        <span className="flex-1 font-medium text-white">Personal Information</span>
                        <span className="material-symbols-outlined text-zinc-600 group-hover:text-zinc-400 transition-colors">chevron_right</span>
                    </Link>
                    <Link to="/profile/notifications" className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-border hover:bg-zinc-800 transition-all group">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                           <span className="material-symbols-outlined">notifications</span>
                        </div>
                        <span className="flex-1 font-medium text-white">Notification Preferences</span>
                        <span className="material-symbols-outlined text-zinc-600 group-hover:text-zinc-400 transition-colors">chevron_right</span>
                    </Link>
                    <Link to="/profile/appearance" className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-border hover:bg-zinc-800 transition-all group">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                           <span className="material-symbols-outlined">palette</span>
                        </div>
                        <span className="flex-1 font-medium text-white">Appearance</span>
                        <span className="material-symbols-outlined text-zinc-600 group-hover:text-zinc-400 transition-colors">chevron_right</span>
                    </Link>
                    <Link to="/profile/reset" className="flex items-center gap-4 bg-surface p-4 rounded-xl border border-border hover:bg-zinc-800 transition-all group">
                        <div className="flex items-center justify-center size-10 rounded-lg bg-absent/10 text-absent">
                           <span className="material-symbols-outlined">restart_alt</span>
                        </div>
                        <span className="flex-1 font-medium text-white">Reset Data</span>
                        <span className="material-symbols-outlined text-zinc-600 group-hover:text-zinc-400 transition-colors">chevron_right</span>
                    </Link>
                </div>

                <div className="mt-12">
                     <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-white py-4 rounded-xl transition-all border border-border font-semibold">
                        Sign Out
                    </button>
                    <p className="text-center text-zinc-600 text-xs mt-6">Version 2.4.1 (Build 890)</p>
                </div>
            </main>
        </div>
    );
};

export default Profile;