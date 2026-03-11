
import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useNotification } from '../../contexts/NotificationContext';

const Appearance: React.FC = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    const [accentColor, setAccentColor] = useState('#10b77f');
    const { showNotification } = useNotification();
    const colors = ['#10b77f', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6'];

    useEffect(() => {
        const root = window.document.documentElement;
        
        if (theme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark', systemPrefersDark);
        } else {
            root.classList.toggle('dark', theme === 'dark');
        }
        
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleSave = () => {
        showNotification("Appearance settings saved!");
    };

    return (
        <div className="flex flex-col h-full">
            <Header title="Appearance" />
            <main className="flex-1 overflow-y-auto px-6 py-8 space-y-8 pb-24 no-scrollbar">
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {(['Light', 'Dark', 'System']).map(t => (
                            <button
                                key={t}
                                onClick={() => setTheme(t.toLowerCase())}
                                className={`p-4 rounded-xl border-2 transition-all ${theme === t.toLowerCase() ? 'border-primary bg-primary/10' : 'border-border bg-surface hover:border-zinc-700'}`}
                            >
                                <div className={`h-16 rounded-lg mb-2 ${t === 'Light' ? 'bg-zinc-200' : t === 'Dark' ? 'bg-zinc-900' : 'bg-gradient-to-br from-zinc-200 from-50% to-zinc-900 to-50%'}`}></div>
                                <span className={`font-semibold text-sm ${theme === t.toLowerCase() ? 'text-primary' : 'text-zinc-300'}`}>{t}</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Accent Color</h3>
                    <div className="flex justify-around items-center bg-surface p-4 rounded-xl border border-border">
                        {colors.map(color => (
                            <button
                                key={color}
                                onClick={() => setAccentColor(color)}
                                className={`w-10 h-10 rounded-full transition-all transform hover:scale-110 ${accentColor === color ? 'ring-2 ring-offset-2 ring-offset-surface ring-white' : ''}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </section>
                
                 <div className="pt-6">
                    <button onClick={handleSave} className="w-full bg-primary hover:bg-primary-dark text-background font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                        Save Appearance Settings
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Appearance;