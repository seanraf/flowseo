
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface AvatarButtonProps {
  initials: string;
  isAuthenticated: boolean;
}

const AvatarButton: React.FC<AvatarButtonProps> = ({ 
  initials, 
  isAuthenticated 
}) => {
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {isAuthenticated ? initials : '?'}
        </AvatarFallback>
      </Avatar>
    </Button>
  );
};

export default AvatarButton;
