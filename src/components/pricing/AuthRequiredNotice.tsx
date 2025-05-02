
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

interface AuthRequiredNoticeProps {
  onSignUp: () => void;
}

const AuthRequiredNotice: React.FC<AuthRequiredNoticeProps> = ({ onSignUp }) => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 text-center">
      <LogIn className="h-12 w-12 mx-auto mb-4 text-primary" />
      <h3 className="text-xl font-bold mb-2">Account Required</h3>
      <p className="text-muted-foreground mb-6">
        You need to create an account or sign in before subscribing to a plan.
      </p>
      <Button onClick={onSignUp} className="w-full md:w-auto">
        Sign Up or Login
      </Button>
    </div>
  );
};

export default AuthRequiredNotice;
