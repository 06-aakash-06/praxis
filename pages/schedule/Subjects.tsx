
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Header from '../../components/Header';
import { supabase } from '../../lib/supabaseClient';
import { Subject, SubjectCategory } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

const AddTab: React.FC<{ onAdd: (subject: Omit<Subject, 'id' | 'created_at' | 'user_id'>) => Promise<void> }> = ({ onAdd }) => {
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: 'THEORY' as SubjectCategory,
        is_atomic: true,
        target_attendance: 75,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number' || type === 'range') {
            setFormData(prev => ({...prev, [name]: parseInt(value) }));
        } else {
            setFormData(prev => ({...prev, [name]: value }));
        }
    }

    const handleCategoryChange = (category: SubjectCategory) => {
        setFormData(prev => ({
            ...prev,
            category: category,
            is_atomic: category === 'THEORY',
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.code) {
            showNotification('Please fill name and faculty', 'error');
            return;
        }
        await onAdd(formData);
        setFormData({ name: '', code: '', category: 'THEORY', is_atomic: true, target_attendance: 75 });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-surface border border-border p-6 rounded-xl space-y-5">
                <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-3" placeholder="Subject Name" type="text" />
                <input name="code" value={formData.code} onChange={handleChange} className="w-full bg-background border border-border rounded-lg px-4 py-3" placeholder="Faculty Name or Code" type="text" />
                
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Subject Type</label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-background border border-border rounded-lg">
                        <button type="button" onClick={() => handleCategoryChange('THEORY')} className={`py-2 rounded-md font-semibold text-sm transition-colors ${formData.category === 'THEORY' ? 'bg-primary text-background' : 'text-zinc-300 hover:bg-zinc-800'}`}>Theory</button>
                        <button type="button" onClick={() => handleCategoryChange('LAB')} className={`py-2 rounded-md font-semibold text-sm transition-colors ${formData.category === 'LAB' ? 'bg-primary text-background' : 'text-zinc-300 hover:bg-zinc-800'}`}>Lab</button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                     <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Target Attendance</label>
                        <span className="text-sm font-bold text-primary">{formData.target_attendance}%</span>
                    </div>
                    <input name="target_attendance" value={formData.target_attendance} onChange={handleChange} type="range" min="0" max="100" className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary" />
                </div>
            </div>
            <motion.button whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-primary hover:bg-primary-dark text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">add_circle</span>
                Register Subject
            </motion.button>
        </form>
    );
};

const EditTab: React.FC<{ subjects: Subject[], onUpdate: (subject: Subject) => Promise<void> }> = ({ subjects, onUpdate }) => {
    const [selectedId, setSelectedId] = useState<string>('');
    const [formData, setFormData] = useState<Partial<Subject>>({});

    useEffect(() => {
        if(subjects.length > 0 && !selectedId) {
            setSelectedId(subjects[0].id);
        }
    }, [subjects, selectedId]);

    useEffect(() => {
        const subject = subjects.find(s => s.id === selectedId);
        setFormData(subject || {});
    }, [selectedId, subjects]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'range') {
            setFormData({ ...formData, [name]: parseInt(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleCategoryChange = (category: SubjectCategory) => {
        setFormData(prev => ({
            ...prev,
            category: category,
            is_atomic: category === 'THEORY',
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(formData as Subject);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Select Subject</label>
                <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-white">
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
            </div>

            {formData.id && (
                <>
                    <div className="bg-surface border border-border p-6 rounded-xl space-y-5">
                       <input name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white"/>
                       <input name="code" value={formData.code || ''} onChange={handleInputChange} placeholder="Faculty Name or Code" className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white"/>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Subject Type</label>
                            <div className="grid grid-cols-2 gap-2 p-1 bg-background border border-border rounded-lg">
                                <button type="button" onClick={() => handleCategoryChange('THEORY')} className={`py-2 rounded-md font-semibold text-sm transition-colors ${formData.category === 'THEORY' ? 'bg-primary text-background' : 'text-zinc-300 hover:bg-zinc-800'}`}>Theory</button>
                                <button type="button" onClick={() => handleCategoryChange('LAB')} className={`py-2 rounded-md font-semibold text-sm transition-colors ${formData.category === 'LAB' ? 'bg-primary text-background' : 'text-zinc-300 hover:bg-zinc-800'}`}>Lab</button>
                            </div>
                        </div>

                       <div className="flex flex-col gap-2">
                             <div className="flex justify-between items-center">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Target Attendance</label>
                                <span className="text-sm font-bold text-primary">{formData.target_attendance}%</span>
                            </div>
                            <input name="target_attendance" value={formData.target_attendance || 75} onChange={handleInputChange} type="range" min="0" max="100" className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary" />
                        </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-primary hover:bg-primary-dark text-background font-bold py-4 rounded-xl">
                        Update Subject
                    </motion.button>
                </>
            )}
        </form>
    );
};

const DeleteTab: React.FC<{ subjects: Subject[], onPromptDelete: (id: string) => void }> = ({ subjects, onPromptDelete }) => {
    return (
        <div className="space-y-3">
            {subjects.map(subject => (
                <div key={subject.id} className="bg-surface border border-border p-4 rounded-xl flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{subject.name}</p>
                        <p className="text-xs text-zinc-400">{subject.code}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => onPromptDelete(subject.id)} className="p-2 rounded-lg bg-absent/10 text-absent hover:bg-absent/20">
                        <span className="material-symbols-outlined">delete</span>
                    </motion.button>
                </div>
            ))}
        </div>
    );
};

const Subjects: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Add');
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
    const { showNotification } = useNotification();
    const tabs = ['Add', 'Edit', 'Delete'];

    const fetchSubjects = useCallback(async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setLoading(false);
            return;
        }
        const { data, error } = await supabase.from('subjects').select('*').eq('user_id', session.user.id).order('name', { ascending: true });
        if (error) {
            console.error('Error fetching subjects', error);
            showNotification('Failed to fetch subjects.', 'error');
        }
        else setSubjects(data || []);
        setLoading(false);
    }, [showNotification]);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    const handleAdd = async (subject: Omit<Subject, 'id' | 'created_at' | 'user_id'>) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            showNotification("Must be logged in", 'error');
            return;
        }
        const { error } = await supabase.from('subjects').insert([{ ...subject, user_id: session.user.id }]);
        if (error) showNotification(error.message, 'error');
        else {
            showNotification('Subject added successfully!');
            fetchSubjects();
        }
    };

    const handleUpdate = async (subject: Subject) => {
        const { error } = await supabase.from('subjects').update(subject).eq('id', subject.id);
        if (error) showNotification(error.message, 'error');
        else {
            showNotification('Subject updated!');
            fetchSubjects();
        }
    };

    const promptDelete = (id: string) => {
        setSubjectToDelete(id);
        setConfirmModalOpen(true);
    };
    
    const confirmDelete = async () => {
        if (!subjectToDelete) return;
        
        setIsDeleting(true);

        try {
            // Step 1: Delete related attendance logs
            const { error: logsError } = await supabase.from('attendance_logs').delete().eq('subject_id', subjectToDelete);
            if (logsError) throw logsError;

            // Step 2: Delete related timetable slots
            const { error: slotsError } = await supabase.from('timetable_slots').delete().eq('subject_id', subjectToDelete);
            if (slotsError) throw slotsError;

            // Step 3: Delete the subject itself
            const { error: subjectError } = await supabase.from('subjects').delete().eq('id', subjectToDelete);
            if (subjectError) throw subjectError;
            
            showNotification('Subject deleted successfully.');
            fetchSubjects();
        } catch (error: any) {
            showNotification(`Failed to delete subject: ${error.message}`, 'error');
        } finally {
            setIsDeleting(false);
            setConfirmModalOpen(false);
            setSubjectToDelete(null);
        }
    };

    const renderTabContent = () => {
        if (loading) return <div>Loading subjects...</div>;
        switch (activeTab) {
            case 'Add': return <AddTab onAdd={handleAdd} />;
            case 'Edit': return <EditTab subjects={subjects} onUpdate={handleUpdate} />;
            case 'Delete': return <DeleteTab subjects={subjects} onPromptDelete={promptDelete} />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <Header title="Manage Subjects" />
            <main className="flex-1 px-6 pb-32 overflow-y-auto no-scrollbar">
                <div className="mt-4 mb-8">
                    <div className="flex p-1 bg-surface border border-border rounded-xl">
                        {tabs.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg ${activeTab === tab ? 'bg-primary text-background' : 'text-zinc-400'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                <div>{renderTabContent()}</div>
            </main>
             <ConfirmationModal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Subject"
                message="Are you sure? This will permanently delete the subject and all its related schedule and attendance data. This action cannot be undone."
                isLoading={isDeleting}
            />
        </div>
    );
};

export default Subjects;