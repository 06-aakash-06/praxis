
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Subject, AttendanceStatus } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { motion } from 'framer-motion';

interface AddDrawerProps {
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const drawerVariants = {
  hidden: { y: '100%' },
  visible: { y: '0%', transition: { type: 'spring', damping: 25, stiffness: 150 } },
  exit: { y: '100%', transition: { type: 'tween', ease: 'anticipate', duration: 0.3 } },
};

const AddDrawer: React.FC<AddDrawerProps> = ({ onClose }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchSubjects = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setLoading(false);
            return;
        }
        const { data, error } = await supabase.from('subjects').select('*').eq('user_id', session.user.id);
        if (data) {
            setSubjects(data);
            if (data.length > 0) {
                setSelectedSubject(data[0].id);
            }
        }
        if(error) console.error("Error fetching subjects for drawer", error);
        setLoading(false);
    }
    fetchSubjects();
  }, []);
  
  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Auto-update end time when start time changes
  useEffect(() => {
    try {
        const [hours, minutes] = startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0);
        startDate.setHours(startDate.getHours() + 1);
        const newEndTime = startDate.toTimeString().slice(0, 5); // "HH:mm"
        setEndTime(newEndTime);
    } catch (e) {
        console.error("Invalid start time format");
    }
  }, [startTime]);

  const handleAddClass = async () => {
    if (!selectedSubject) {
        showNotification("Please select a subject.", "error");
        return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        showNotification("You must be logged in.", "error");
        return;
    }

    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const formattedStartTime = `${startTime}:00`;
    const formattedEndTime = `${endTime}:00`;

    const logData = {
        user_id: session.user.id,
        subject_id: selectedSubject,
        date,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        status: 'PRESENT' as AttendanceStatus,
        is_override: true,
    };
    
    // Fix: Safely check for existing entry instead of relying on compound UNIQUE constraint
    const { data: existingLog, error: selectError } = await supabase
        .from('attendance_logs')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('subject_id', selectedSubject)
        .eq('date', date)
        .eq('start_time', formattedStartTime)
        .maybeSingle();

    if (selectError) {
        showNotification(`DB Read Error: ${selectError.message}`, 'error');
        return;
    }

    let queryError = null;

    if (existingLog) {
        const { error } = await supabase
            .from('attendance_logs')
            .update({
                end_time: formattedEndTime,
                status: 'PRESENT',
                is_override: true
            })
            .eq('id', existingLog.id);
        queryError = error;
    } else {
        const { error } = await supabase
            .from('attendance_logs')
            .insert([logData]);
        queryError = error;
    }

    if (queryError) {
        showNotification(`Error: ${queryError.message}`, 'error');
        console.error("Supabase DB Error:", queryError);
    } else {
        showNotification("Extra class added successfully!");
        onClose();
    }
  };

  return (
    <motion.div 
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div 
        variants={drawerVariants}
        className="w-full bg-surface border-t border-border rounded-t-2xl p-4 pt-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-lg font-bold text-white">Add Extra Class</h2>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400">
            <span className="material-symbols-outlined text-xl">close</span>
          </motion.button>
        </div>

        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">Select Subject</div>
        <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar pr-1">
          {loading ? <p>Loading subjects...</p> : subjects.map(subject => (
            <motion.div
              key={subject.id}
              onClick={() => setSelectedSubject(subject.id)}
              whileTap={{ scale: 0.98 }}
              className={`group relative border rounded-xl p-3 cursor-pointer transition-colors duration-200 ${
                selectedSubject === subject.id
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-zinc-900/50 border-border hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${selectedSubject === subject.id ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-zinc-800 border-border text-zinc-400'}`}>
                    <span className="material-symbols-outlined text-xl">book</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{subject.name}</h4>
                    <p className="text-[10px] text-zinc-400 font-mono">{subject.code} • {subject.category}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedSubject === subject.id ? 'bg-primary border-primary' : 'border-zinc-700 group-hover:border-zinc-500'}`}>
                  {selectedSubject === subject.id && <span className="material-symbols-outlined text-[14px] text-background font-bold">check</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-2 border-t border-border mt-4">
          <div className="flex space-x-3 my-4">
            <div className="flex-1">
              <label className="block text-[10px] font-medium text-zinc-500 mb-1 ml-1">START TIME</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-background border border-border rounded-lg text-xs text-white py-2.5 px-3 appearance-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50" />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-medium text-zinc-500 mb-1 ml-1">END TIME</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-background border border-border rounded-lg text-xs text-white py-2.5 px-3 appearance-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50" />
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.98 }} onClick={handleAddClass} className="w-full py-3.5 bg-primary hover:bg-primary-dark text-background font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center space-x-2 text-sm">
            <span className="material-symbols-outlined text-lg">add_circle</span>
            <span>Add to Today's Log</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddDrawer;