
import React, { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarButtonProps {
  initials: string;
  isAuthenticated: boolean;
  imageUrl?: string;
  onClick?: () => void;
}

const AvatarButton = forwardRef<HTMLButtonElement, AvatarButtonProps>(({ 
  initials, 
  isAuthenticated,
  imageUrl,
  onClick
}, ref) => {
  return (
    <Button 
      ref={ref}
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 rounded-full cursor-pointer" 
      onClick={onClick}
    >
      <Avatar className="h-8 w-8">
        {imageUrl && <AvatarImage src={imageUrl} alt="User avatar" />}
        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
          {isAuthenticated ? initials : '?'}
        </AvatarFallback>
      </Avatar>
    </Button>
  );
});

AvatarButton.displayName = 'AvatarButton';

export default AvatarButton;
