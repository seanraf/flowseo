
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface GuestMenuProps {
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const GuestMenu: React.FC<GuestMenuProps> = ({ setDropdownOpen }) => {
  const navigate = useNavigate();

  const handleNavigation = (path: string, tab?: string) => {
    setDropdownOpen(false);
    if (tab) {
      navigate(`${path}?tab=${tab}`);
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <DropdownMenuLabel>Account</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => handleNavigation('/auth')}>
        <LogIn className="mr-2 h-4 w-4" />
        <span>Login</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleNavigation('/auth', 'register')}>
        <UserPlus className="mr-2 h-4 w-4" />
        <span>Sign up</span>
      </DropdownMenuItem>
    </>
  );
};

export default GuestMenu;
