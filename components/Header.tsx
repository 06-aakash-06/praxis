
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  rightAction?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ title, rightAction }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md px-4 pt-6 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-surface text-primary border border-border">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        </div>
        <div>{rightAction}</div>
      </div>
    </header>
  );
};

export default Header;
