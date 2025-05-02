
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarButtonProps {
  initials: string;
  isAuthenticated: boolean;
  imageUrl?: string;
}

const AvatarButton: React.FC<AvatarButtonProps> = ({ 
  initials, 
  isAuthenticated,
  imageUrl
}) => {
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
      <Avatar className="h-8 w-8">
        {imageUrl && <AvatarImage src={imageUrl} alt="User avatar" />}
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {isAuthenticated ? initials : '?'}
        </AvatarFallback>
      </Avatar>
    </Button>
  );
};

export default AvatarButton;
