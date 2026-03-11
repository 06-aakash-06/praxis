
import React from 'react';
import Header from '../../components/Header';
import { useNotification } from '../../contexts/NotificationContext';

const ToggleSwitch: React.FC<{ label: string; description: string; defaultChecked?: boolean }> = ({ label, description, defaultChecked = false }) => (
    <div className="flex items-center justify-between">
        <div>
            <h4 className="font-semibold text-white">{label}</h4>
            <p className="text-sm text-zinc-400">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
    </div>
);

const Notifications: React.FC = () => {
    const { showNotification } = useNotification();

    const handleUpdate = () => {
        showNotification("Notification preferences updated!");
    };

    return (
        <div className="flex flex-col h-full">
            <Header title="Notifications" />
            <main className="flex-1 overflow-y-auto px-4 py-8 space-y-6 pb-24 no-scrollbar">
                <div className="bg-surface border border-border rounded-xl p-5 space-y-6">
                    <h3 className="font-bold text-lg">Push Notifications</h3>
                    <ToggleSwitch label="Class Reminders" description="15 minutes before class" defaultChecked />
                    <ToggleSwitch label="Event Alerts" description="Updates on campus events" defaultChecked />
                    <ToggleSwitch label="Attendance Warnings" description="Low attendance alerts" />
                </div>
                 <div className="bg-surface border border-border rounded-xl p-5 space-y-6">
                    <h3 className="font-bold text-lg">Email Notifications</h3>
                    <ToggleSwitch label="Weekly Summary" description="Attendance & schedule report" defaultChecked />
                    <ToggleSwitch label="OD Status Updates" description="Changes in OD requests" />
                    <ToggleSwitch label="Campus Newsletter" description="General university news" />
                </div>
                 <div className="bg-surface border border-border rounded-xl p-5 space-y-6">
                    <h3 className="font-bold text-lg">Testing</h3>
                    <ToggleSwitch label="Beta Features" description="Enable experimental functionality" />
                    <ToggleSwitch label="Developer Logs" description="Show logs in browser console" />
                </div>
                 <div className="px-2">
                    <button onClick={handleUpdate} className="w-full bg-primary hover:bg-primary-dark text-background font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                        Update Preferences
                    </button>
                </div>
            </main>
        </div>
    );
};

export default Notifications;