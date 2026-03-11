
import React from 'react';
import Header from '../../components/Header';
import { useNotification } from '../../contexts/NotificationContext';
import { supabase } from '../../lib/supabaseClient';

const Security: React.FC = () => {
    const { showNotification } = useNotification();

    const handleSignOutAll = async () => {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) {
            showNotification(error.message, 'error');
        } else {
            showNotification("Signed out from all other devices.", "info");
        }
    };

    return (
        <div className="flex flex-col h-full">
            <Header title="Security & Privacy" />
            <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8 pb-24 no-scrollbar">
                <section className="bg-surface border border-border rounded-xl p-5">
                    <h3 className="font-bold text-lg mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-400">Enhance your account security.</p>
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition-colors">
                            Enable
                        </button>
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Active Sessions</h3>
                    <div className="space-y-3">
                        <div className="bg-surface border border-border p-4 rounded-xl flex items-center gap-4">
                            <span className="material-symbols-outlined text-primary text-3xl">desktop_windows</span>
                            <div>
                                <p className="font-semibold text-white">This Browser</p>
                                <p className="text-xs text-zinc-400">Current active session</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                 <div className="pt-6">
                    <button onClick={handleSignOutAll} className="w-full bg-absent/10 border border-absent/20 text-absent font-bold py-4 rounded-xl transition-all hover:bg-absent/20 active:scale-[0.98]">
                        Sign Out of All Other Devices
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Security;
