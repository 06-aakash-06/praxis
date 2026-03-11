
import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';

interface BottomNavProps {
  onAddClick: () => void;
}

const NavItem = ({ to, icon, label }: { to: string; icon: string; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center gap-1 w-16 transition-colors ${
        isActive ? 'text-primary' : 'text-zinc-500 hover:text-primary'
      }`
    }
  >
    {({ isActive }) => (
      <motion.div
        whileTap={{ scale: 0.9 }}
        className="flex flex-col items-center gap-1 w-16"
      >
        <span className={`material-symbols-outlined ${isActive ? 'fill' : ''}`}>{icon}</span>
        <span className={`text-[10px] uppercase tracking-tighter ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
      </motion.div>
    )}
  </NavLink>
);

const BottomNav: React.FC<BottomNavProps> = ({ onAddClick }) => {
  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.5 }}
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background/90 backdrop-blur-xl border-t border-border z-40 px-4 pt-3 pb-6 sm:pb-3"
    >
      <div className="flex justify-between items-center">
        <NavItem to="/" icon="dashboard" label="Dashboard" />
        <NavItem to="/schedule" icon="calendar_month" label="Schedule" />
        
        <div className="flex-shrink-0 -mt-10">
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={onAddClick}
            className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-background shadow-lg shadow-primary/30 border-4 border-background"
            aria-label="Add new class"
          >
            <span className="material-symbols-outlined !text-4xl" style={{ fontVariationSettings: "'wght' 600" }}>add</span>
          </motion.button>
        </div>
        
        <NavItem to="/insights" icon="insights" label="Insights" />
        <NavItem to="/profile" icon="person" label="Profile" />
      </div>
    </motion.nav>
  );
};

export default BottomNav;
