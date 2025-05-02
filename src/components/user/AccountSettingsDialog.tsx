
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';

interface AccountSettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Schemas for validation
const DisplayInitialsSchema = z.object({
  display_initials: z.string()
    .min(1, 'Display initials must be at least 1 character')
    .max(2, 'Display initials cannot be more than 2 characters')
    .regex(/^[A-Za-z0-9]*$/, 'Only letters and numbers are allowed')
});

const PasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your new password')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const AccountSettingsDialog: React.FC<AccountSettingsDialogProps> = ({ 
  isOpen, 
  onOpenChange,
  onSuccess 
}) => {
  const [activeTab, setActiveTab] = useState("profile");
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  
  // Profile state
  const [displayInitials, setDisplayInitials] = useState(profile?.display_initials || '');
  const [profileIsLoading, setProfileIsLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordIsLoading, setPasswordIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Delete account state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteIsLoading, setDeleteIsLoading] = useState(false);
  
  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');

    try {
      setProfileIsLoading(true);
      
      // Validate input
      const result = DisplayInitialsSchema.safeParse({ display_initials: displayInitials });
      if (!result.success) {
        setProfileError(result.error.errors[0].message);
        return;
      }

      // Make sure user exists
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Update the profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          display_initials: displayInitials.toUpperCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: "Profile Updated",
        description: "Your display initials have been successfully updated."
      });

      // Call the success callback if provided
      if (onSuccess) {
        setTimeout(() => onSuccess(), 100);
      }
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
      toast({
        title: "Update Failed",
        description: err.message || 'Failed to update profile',
        variant: "destructive"
      });
    } finally {
      setProfileIsLoading(false);
    }
  };
  
  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    try {
      setPasswordIsLoading(true);
      
      // Validate input
      const result = PasswordSchema.safeParse({ 
        currentPassword, 
        newPassword, 
        confirmPassword 
      });
      
      if (!result.success) {
        setPasswordError(result.error.errors[0].message);
        return;
      }

      // Update the password in Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed."
      });

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
      toast({
        title: "Update Failed",
        description: err.message || 'Failed to change password',
        variant: "destructive"
      });
    } finally {
      setPasswordIsLoading(false);
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      setDeleteIsLoading(true);

      // Delete the user account
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '');
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted."
      });
      
      // Sign out after deletion
      await signOut();
      
      // Close dialogs
      setDeleteDialogOpen(false);
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Deletion Failed",
        description: err.message || 'Failed to delete account',
        variant: "destructive"
      });
    } finally {
      setDeleteIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-4 py-4">
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your email cannot be changed.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="display_initials">Display Initials</Label>
                  <Input
                    id="display_initials"
                    value={displayInitials}
                    onChange={(e) => setDisplayInitials(e.target.value.slice(0, 2).toUpperCase())}
                    placeholder="Enter 1-2 characters"
                    className="uppercase"
                    maxLength={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    These initials will appear in your avatar. Maximum 2 characters.
                  </p>
                  {profileError && (
                    <p className="text-xs text-destructive">{profileError}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="submit" 
                    disabled={profileIsLoading}
                  >
                    {profileIsLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4 py-4">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                  />
                  {passwordError && (
                    <p className="text-xs text-destructive">{passwordError}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="submit" 
                    disabled={passwordIsLoading}
                  >
                    {passwordIsLoading ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </div>
              </form>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Delete Account</h3>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete your account and all associated data.
                  </p>
                </div>
                
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteIsLoading}
            >
              {deleteIsLoading ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AccountSettingsDialog;
