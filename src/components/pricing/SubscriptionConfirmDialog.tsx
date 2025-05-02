
import React from 'react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface SubscriptionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: 'limited' | 'unlimited' | null;
  loading: boolean;
  onConfirm: () => void;
}

const SubscriptionConfirmDialog: React.FC<SubscriptionConfirmDialogProps> = ({
  open,
  onOpenChange,
  selectedPlan,
  loading,
  onConfirm
}) => {
  const planName = selectedPlan === 'limited' ? 'Limited ($20/month)' : 'Unlimited ($99/month)';
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Subscription</AlertDialogTitle>
          <AlertDialogDescription>
            You're about to subscribe to the {planName} plan. 
            You'll be redirected to Stripe to complete your payment.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={loading} onClick={onConfirm}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Processing
              </>
            ) : (
              'Continue to Checkout'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SubscriptionConfirmDialog;
