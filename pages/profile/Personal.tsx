
import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabaseClient';
import { User } from '@supabase/supabase-js';

const Personal: React.FC = () => {
    const { showNotification } = useNotification();
    const [user, setUser] = useState<User | null>(null);
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setFullName(user?.user_metadata?.full_name || '');
            setLoading(false);
        };
        fetchUser();
    }, []);

    const handleSaveChanges = async () => {
        if (!user) return;
        const { error } = await supabase.auth.updateUser({
            data: { full_name: fullName }
        });

        if (error) {
            showNotification(error.message, 'error');
        } else {
            showNotification("Profile updated successfully!");
        }
    };

    if (loading) {
        return (
             <div className="flex flex-col h-full">
                <Header title="Personal Information" />
                <div className="flex-1 flex items-center justify-center">Loading...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <Header title="Personal Information" />
            <main className="flex-1 overflow-y-auto px-6 py-8 space-y-6 pb-24 no-scrollbar">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1 mb-2 block">Full Name</label>
                        <input 
                            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            type="text" 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1 mb-2 block">Email Address</label>
                        <input 
                            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-zinc-400 placeholder:text-zinc-600 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all" 
                            value={user?.email || ''}
                            type="email" 
                            readOnly
                        />
                         <p className="text-[11px] text-zinc-500 mt-2 ml-1">Email address cannot be changed.</p>
                    </div>
                     <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1 mb-2 block">Student ID</label>
                        <input 
                            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-zinc-400 placeholder:text-zinc-600" 
                            defaultValue="UNIV-2023-1045"
                            type="text" 
                            readOnly
                        />
                    </div>
                </div>
                 <div className="pt-6 border-t border-border">
                    <button onClick={handleSaveChanges} className="w-full bg-primary hover:bg-primary-dark text-background font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                        Save Changes
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Personal;
