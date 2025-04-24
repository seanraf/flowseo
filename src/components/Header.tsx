
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Menu, Cloud, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            <span className="text-lg font-medium tracking-tight">
              {activeConversationTitle || 'FlowSEO'}
            </span>
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
