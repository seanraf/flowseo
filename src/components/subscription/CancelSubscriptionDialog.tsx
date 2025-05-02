
import React from 'react';
import { AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface CancelSubscriptionDialogProps {
  cancelling: boolean;
  onCancel: () => void;
  error?: string | null;
}

const CancelSubscriptionDialog: React.FC<CancelSubscriptionDialogProps> = ({ 
  cancelling, 
  onCancel,
  error
}) => {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
        <AlertDialogDescription>
          Your subscription will remain active until the end of the current billing period. After that, you will be downgraded to the free plan.
        </AlertDialogDescription>
        
        {error && (
          <div className="mt-2 p-2 text-sm bg-destructive/10 text-destructive rounded-md">
            <p>{error}</p>
          </div>
        )}
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
