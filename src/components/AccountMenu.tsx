
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { User, Settings, CreditCard, LogOut, UserPlus, LogIn } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import UserProfileForm from '@/components/UserProfileForm';
import PasswordChangeForm from '@/components/PasswordChangeForm';

const AccountMenu = () => {
  const { user, profile, signOut, subscriptionTier, openCustomerPortal } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profileDialogOpen, setProfileDialogOpen] = React.useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = React.useState(false);
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };
  
  const handleOpenCustomerPortal = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open customer portal",
        variant: "destructive"
      });
    }
  };

  const handleNavigation = (path: string) => {
    setDropdownOpen(false);
    navigate(path);
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user ? getInitials() : '?'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {user ? (
            <>
              <DropdownMenuLabel>
                {user.email}
                {subscriptionTier !== 'free' && (
                  <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded bg-primary text-primary-foreground">
                    {subscriptionTier === 'limited' ? 'Limited' : 'Unlimited'}
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                setDropdownOpen(false);
                setTimeout(() => setProfileDialogOpen(true), 100);
              }}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setDropdownOpen(false);
                setTimeout(() => setPasswordDialogOpen(true), 100);
              }}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Change Password</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleOpenCustomerPortal}>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Subscription</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleNavigation('/auth')}>
                <LogIn className="mr-2 h-4 w-4" />
                <span>Login</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigation('/auth')}>
                <UserPlus className="mr-2 h-4 w-4" />
                <span>Sign up</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog 
        open={profileDialogOpen} 
        onOpenChange={(open) => {
          setProfileDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <UserProfileForm onSuccess={() => setProfileDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog 
        open={passwordDialogOpen} 
        onOpenChange={(open) => {
          setPasswordDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <PasswordChangeForm onSuccess={() => setPasswordDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccountMenu;
