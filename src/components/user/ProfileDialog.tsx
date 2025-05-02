
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UserProfileForm from '@/components/UserProfileForm';

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ 
  isOpen, 
  onOpenChange, 
  onSuccess 
}) => {
  const handleProfileDialogClose = (success = false) => {
    onOpenChange(false);
    
    if (success) {
      setTimeout(() => onSuccess(), 100);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          handleProfileDialogClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Display Initials</DialogTitle>
        </DialogHeader>
        <UserProfileForm onSuccess={() => handleProfileDialogClose(true)} />
      </DialogContent>
    </Dialog>
  );
};

export default ProfileDialog;
