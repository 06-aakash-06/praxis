
import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useNotification } from '../contexts/NotificationContext';

const InsightCard: React.FC<{ to: string, icon: string, title: string, description: string }> = ({ to, icon, title, description }) => (
    <Link to={to} className="flex flex-col items-start p-5 rounded-xl bg-surface border border-border group active:scale-95 transition-transform text-left aspect-square justify-between hover:border-primary/50">
        <div className="bg-primary/10 p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-primary text-3xl">{icon}</span>
        </div>
        <div>
            <h3 className="font-bold text-lg leading-tight">{title}</h3>
            <p className="text-zinc-400 text-xs mt-1">{description}</p>
        </div>
    </Link>
);

const Insights: React.FC = () => {
  const { showNotification } = useNotification();

  return (
    <div className="flex flex-col h-full">
        <Header title="Stats & Insights" />
        <main className="flex-1 p-4 overflow-y-auto no-scrollbar pb-32">
            <div className="grid grid-cols-2 gap-4 mb-8">
                <InsightCard to="/insights/timeline" icon="timeline" title="Events Timeline" description="View all academic & social events" />
                <InsightCard to="/insights/attendance" icon="person_check" title="Attendance Records" description="View attendance of all classes" />
                <InsightCard to="/schedule/holidays" icon="beach_access" title="Holiday List" description="View all upcoming holidays" />
                <InsightCard to="/insights/od" icon="badge" title="OD Tracking" description="View and update OD details" />
            </div>
             <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 px-1">Under Testing</h2>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => showNotification("Export to CSV is coming in a future update!", "info")}
                        className="flex items-center gap-3 p-4 rounded-lg bg-surface border border-border text-left group hover:border-primary/30 transition-colors active:scale-95"
                    >
                        <div className="flex items-center justify-center size-10 rounded-full bg-zinc-800 border border-zinc-700 text-pending">
                            <span className="material-symbols-outlined text-xl">table_chart</span>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-semibold text-sm truncate text-white">Export as CSV</span>
                        </div>
                    </button>
                    <button 
                        onClick={() => showNotification("Export to PDF is coming in a future update!", "info")}
                        className="flex items-center gap-3 p-4 rounded-lg bg-surface border border-border text-left group hover:border-primary/30 transition-colors active:scale-95"
                    >
                        <div className="flex items-center justify-center size-10 rounded-full bg-zinc-800 border border-zinc-700 text-pending">
                            <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-semibold text-sm truncate text-white">Export as PDF</span>
                        </div>
                    </button>
                </div>
            </section>
        </main>
    </div>
  );
};

export default Insights;