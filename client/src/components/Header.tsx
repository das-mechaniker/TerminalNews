import React from 'react';
import { useRefreshNews } from '@/hooks/useNews';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarVisible: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarVisible }) => {
  const { mutate: refreshNews, isPending } = useRefreshNews();

  return (
    <header className="terminal-header">
      <div className="flex justify-between items-center px-2 py-0.5 text-xs">
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
          <button 
            className="terminal-action-button bg-[#E41A1C] text-white font-bold"
            onClick={() => refreshNews()}
            disabled={isPending}
          >
            {isPending ? 'REFRESHING...' : 'REFRESH'}
          </button>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <span className="text-[#999999]">PG 1/1</span>
          <span className="text-[#FFBF00]">NEWS MONITOR</span>
        </div>
      </div>
      <div className="flex justify-between items-center px-2 py-0.5 bg-[#121212] text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-white font-bold tracking-tight">TERMINAL_NEWS</span>
          <button 
            className="text-[#FFBF00] hover:text-white ml-1"
            onClick={onToggleSidebar}
            aria-label={isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
          >
            {isSidebarVisible ? "×" : "☰"}
          </button>
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide text-xs">
          <span className="px-1 text-[#999999]">◄►</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
