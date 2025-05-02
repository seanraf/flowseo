
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { XCircle, ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';

const Cancel = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size="lg" />
          </div>
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Subscription Cancelled</CardTitle>
          <CardDescription>
            Your subscription process was cancelled and you have not been charged.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p>
            If you encountered any issues during the checkout process or have questions about our plans, 
            please don't hesitate to contact our support team.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <Button onClick={handleBack} className="flex gap-2">
            <ArrowLeft className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Cancel;
