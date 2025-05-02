
import React from 'react';
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface CancelSubscriptionDialogProps {
  cancelling: boolean;
  onCancel: () => void;
}

const CancelSubscriptionDialog: React.FC<CancelSubscriptionDialogProps> = ({ 
  cancelling, 
  onCancel 
}) => {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
        <AlertDialogDescription>
          Your subscription will remain active until the end of the current billing period. After that, you will be downgraded to the free plan.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={cancelling}>Keep Subscription</AlertDialogCancel>
        <AlertDialogAction 
          onClick={(e) => {
            e.preventDefault();
            onCancel();
          }}
          disabled={cancelling}
        >
          {cancelling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            'Cancel Subscription'
          )}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default CancelSubscriptionDialog;
