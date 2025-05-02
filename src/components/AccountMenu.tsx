
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import AuthenticatedMenu from '@/components/user/AuthenticatedMenu';
import GuestMenu from '@/components/user/GuestMenu';
import AvatarButton from '@/components/user/AvatarButton';
import AccountSettingsDialog from '@/components/user/AccountSettingsDialog';

const AccountMenu = () => {
  const { user, profile, signOut, subscriptionTier, checkSubscription, openCustomerPortal } = useAuth();
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [initials, setInitials] = useState('');

  // Initialize and update initials when profile changes
  useEffect(() => {
    if (profile) {
      setInitials(getInitialsFromProfile());
    }
  }, [profile]);

  // Get initials from profile or email
  const getInitialsFromProfile = () => {
    // Check for custom display initials in profile first
    if (profile?.display_initials) {
      return profile.display_initials.toUpperCase();
    }
    
    // Fallback to email-based initials
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };
  
  // Handle settings dialog close with proper refresh
  const handleSettingsSuccess = () => {
    // Use setTimeout to avoid state update conflicts
    setTimeout(() => {
      checkSubscription().catch(error => {
        console.error("Error refreshing profile data:", error);
      });
    }, 100);
  };

  // Toggle dropdown manually to ensure it works for all users
  const handleToggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <AvatarButton 
            initials={initials} 
            isAuthenticated={!!user} 
            onClick={handleToggleDropdown}
            imageUrl={profile?.avatar_url}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {user ? (
            <AuthenticatedMenu 
              email={user.email || ''}
              subscriptionTier={subscriptionTier}
              onSettingsClick={() => setSettingsDialogOpen(true)}
              onSignOut={signOut}
              setDropdownOpen={setDropdownOpen}
              openCustomerPortal={openCustomerPortal}
            />
          ) : (
            <GuestMenu setDropdownOpen={setDropdownOpen} />
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountSettingsDialog 
        isOpen={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        onSuccess={handleSettingsSuccess}
      />
    </>
  );
};

export default AccountMenu;
