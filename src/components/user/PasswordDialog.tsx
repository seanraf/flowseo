
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PasswordChangeForm from '@/components/PasswordChangeForm';

interface PasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PasswordDialog: React.FC<PasswordDialogProps> = ({ 
  isOpen, 
  onOpenChange 
}) => {
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <PasswordChangeForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default PasswordDialog;
