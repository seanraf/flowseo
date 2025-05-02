
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

interface HeaderProps {
  toggleSidebar: () => void;
  activeConversationTitle: string | null;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, activeConversationTitle }) => {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 w-full glass-effect border-b border-border/50 transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="md:hidden h-8 w-8 rounded-full"
          >
            <span className="sr-only">Toggle Sidebar</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </Button>
          
          <div className="flex items-center gap-2">
            {activeConversationTitle ? (
              <span className="text-lg font-medium tracking-tight">
                {activeConversationTitle}
              </span>
            ) : (
              <Logo />
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          className="h-8 w-8 rounded-full"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
