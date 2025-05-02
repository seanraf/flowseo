
import React from 'react';
import { User, Settings, CreditCard, LogOut } from 'lucide-react';
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface AuthenticatedMenuProps {
  email: string;
  subscriptionTier: string;
  onProfileClick: () => void;
  onPasswordClick: () => void;
  onSignOut: () => Promise<void>;
  setDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openCustomerPortal: () => Promise<void>;
}

const AuthenticatedMenu: React.FC<AuthenticatedMenuProps> = ({
  email,
  subscriptionTier,
  onProfileClick,
  onPasswordClick,
  onSignOut,
  setDropdownOpen,
  openCustomerPortal
}) => {
  const handleManageSubscription = async () => {
    setDropdownOpen(false);
    try {
      await openCustomerPortal();
    } catch (error) {
      console.error("Failed to open customer portal:", error);
    }
  };

  return (
    <>
      <DropdownMenuLabel>
        {email}
        {subscriptionTier !== 'free' && (
          <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded bg-primary text-primary-foreground">
            {subscriptionTier === 'limited' ? 'Limited' : 'Unlimited'}
          </span>
        )}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => {
        setDropdownOpen(false);
        setTimeout(() => onProfileClick(), 100);
      }}>
        <User className="mr-2 h-4 w-4" />
        <span>Display Initials</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => {
        setDropdownOpen(false);
        setTimeout(() => onPasswordClick(), 100);
      }}>
        <Settings className="mr-2 h-4 w-4" />
        <span>Change Password</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleManageSubscription}>
        <CreditCard className="mr-2 h-4 w-4" />
        <span>Manage Subscription</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onSignOut}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </>
  );
};

export default AuthenticatedMenu;
