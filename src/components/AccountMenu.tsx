
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
import ProfileDialog from '@/components/user/ProfileDialog';
import PasswordDialog from '@/components/user/PasswordDialog';

const AccountMenu = () => {
  const { user, profile, signOut, subscriptionTier, checkSubscription } = useAuth();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
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
  
  // Handle profile dialog close with proper refresh
  const handleProfileSuccess = () => {
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
          <div> {/* Wrapper div to ensure proper event handling */}
            <AvatarButton 
              initials={initials} 
              isAuthenticated={!!user} 
              onClick={handleToggleDropdown}
            />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {user ? (
            <AuthenticatedMenu 
              email={user.email || ''}
              subscriptionTier={subscriptionTier}
              onProfileClick={() => setProfileDialogOpen(true)}
              onPasswordClick={() => setPasswordDialogOpen(true)}
              onSignOut={signOut}
              setDropdownOpen={setDropdownOpen}
            />
          ) : (
            <GuestMenu setDropdownOpen={setDropdownOpen} />
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileDialog 
        isOpen={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        onSuccess={handleProfileSuccess}
      />

      <PasswordDialog
        isOpen={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </>
  );
};

export default AccountMenu;
