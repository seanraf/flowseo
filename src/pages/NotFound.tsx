
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the case where we might be coming from Stripe checkout
    const checkoutInProgress = localStorage.getItem('checkoutInProgress');
    if (checkoutInProgress) {
      console.log("Checkout was in progress but hit 404 page, redirecting to homepage");
      localStorage.removeItem('checkoutInProgress');
      // Set activated flag so the home page knows to show a toast
      localStorage.setItem('subscriptionActivated', 'true');
      navigate('/', { replace: true });
    }
    
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname, navigate]);

  const goBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        
        <div className="flex flex-col space-y-4">
          <Button 
            variant="outline" 
            className="flex items-center" 
            onClick={goBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          
          <Button 
            asChild
            variant="default"
          >
            <a href="/">Return to Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
