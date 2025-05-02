
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import MainContent from '@/components/MainContent';
import LoadingScreen from '@/components/LoadingScreen';
import { useConversations } from '@/hooks/useConversations';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [subscriptionInitialized, setSubscriptionInitialized] = useState(false);
  const FREE_MESSAGE_LIMIT = 10;

  const { user, profile, tempUser, isLoading, checkSubscription, subscriptionTier } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const {
    conversations,
    activeConversationId,
    activeConversation,
    handleSelectConversation,
    handleNewConversation,
    handleDeleteConversation,
    handleRenameConversation
  } = useConversations();

  // Check for any pending checkout process on initial load
  useEffect(() => {
    const checkoutInProgress = localStorage.getItem('checkoutInProgress');
    
    const initPage = async () => {
      if (checkoutInProgress) {
        console.log("Checkout was in progress, refreshing subscription status");
        // Wait a moment to ensure subscription check has completed
        await new Promise(r => setTimeout(r, 1000));
        // Force refresh subscription status
        try {
          await checkSubscription();
          
          // If subscription is active, show a toast notification
          if (subscriptionTier === 'unlimited' || subscriptionTier === 'limited') {
            toast({
              title: "Subscription Active",
              description: `Your ${subscriptionTier} subscription is active.`,
            });
          }
        } catch (e) {
          console.error("Error refreshing subscription status:", e);
          toast({
            variant: "destructive",
            title: "Error checking subscription",
            description: "We couldn't verify your subscription status. Please try again later.",
          });
        } finally {
          // Remove the flag regardless of the outcome
          localStorage.removeItem('checkoutInProgress');
        }
      }
      setSubscriptionInitialized(true);
      setPageLoading(false);
    };
    
    if (!isLoading) {
      initPage();
    }
  }, [isLoading, checkSubscription, toast, subscriptionTier]);

  // Show a toast when subscription tier changes to unlimited
  useEffect(() => {
    if (subscriptionInitialized && subscriptionTier === 'unlimited') {
      toast({
        title: "Unlimited Plan Active",
        description: "You have access to unlimited features with your subscription.",
      });
    }
  }, [subscriptionTier, subscriptionInitialized, toast]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // This function will be passed to ChatInterface to track message count
  const incrementMessageCount = () => {
    const currentUser = user || tempUser;
    const currentProfile = profile || { tier: 'free' };

    setMessageCount(prevCount => prevCount + 1);
      
    if (currentProfile.tier === 'free' && messageCount + 1 >= FREE_MESSAGE_LIMIT) {
      toast({
        title: "Free Plan Message Limit Reached",
        description: "You've reached the 10 message limit for the free plan. Register to continue chatting or upgrade.",
        variant: "destructive",
      });
    }
  };
  
  const isUnlimitedUser = subscriptionTier === 'unlimited';

  // If no user is logged in and not a temp user, redirect to auth
  useEffect(() => {
    if (!isLoading && !user && !tempUser) {
      navigate('/auth');
    }
  }, [user, tempUser, isLoading, navigate]);

  if (isLoading || pageLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-10 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        conversations={conversations}
        onSelectConversation={handleSelectConversation}
        onNewConversation={() => handleNewConversation(isUnlimitedUser)}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
      />
      
      <MainContent 
        toggleSidebar={toggleSidebar}
        activeConversationTitle={activeConversation?.title || null}
        activeConversationId={activeConversationId}
        isUnlimitedUser={isUnlimitedUser}
        messageLimitReached={!isUnlimitedUser && messageCount >= FREE_MESSAGE_LIMIT}
        messageCount={messageCount}
        incrementMessageCount={incrementMessageCount}
      />
    </div>
  );
};

export default Index;
