
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

const LoadingScreen: React.FC = () => {
  const [loadingTooLong, setLoadingTooLong] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set timeout to detect if loading is taking too long
    const timeoutId = setTimeout(() => {
      setLoadingTooLong(true);
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeoutId);
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">Loading...</p>
        
        {loadingTooLong && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Loading is taking longer than expected. There might be an issue with the connection or authentication.
            </p>
            <div className="flex gap-4 mt-2">
              <Button onClick={handleRetry} variant="outline">
                Retry
              </Button>
              <Button onClick={() => navigate('/auth')} variant="default">
                Go to Login
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
