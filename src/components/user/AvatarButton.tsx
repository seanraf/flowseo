
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarButtonProps {
  initials: string;
  isAuthenticated: boolean;
  imageUrl?: string;
  onClick?: () => void; // Add onClick prop to handle click events
}

const AvatarButton: React.FC<AvatarButtonProps> = ({ 
  initials, 
  isAuthenticated,
  imageUrl,
  onClick
}) => {
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 rounded-full cursor-pointer" 
      onClick={onClick} // Pass the onClick handler to the button
    >
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
