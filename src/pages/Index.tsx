
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([
    { id: '1', title: 'New Sandbox', active: true },
  ]);
  const [activeConversationId, setActiveConversationId] = useState('1');
  const { toast } = useToast();
  const [messageCount, setMessageCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const FREE_MESSAGE_LIMIT = 10;

  const { user, profile, tempUser, isLoading, checkSubscription } = useAuth();
  const navigate = useNavigate();

  // Check for any pending checkout process on initial load
  useEffect(() => {
    const checkoutInProgress = localStorage.getItem('checkoutInProgress');
    
    const initPage = async () => {
      if (checkoutInProgress) {
        // Wait a moment to ensure subscription check has completed
        await new Promise(r => setTimeout(r, 1000));
        // Force refresh subscription status
        try {
          await checkSubscription();
        } catch (e) {
          console.error("Error refreshing subscription status:", e);
        }
        // Remove the flag
        localStorage.removeItem('checkoutInProgress');
      }
      setPageLoading(false);
    };
    
    initPage();
  }, [checkSubscription]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSelectConversation = (id: string) => {
    setConversations(conversations.map(conv => ({
      ...conv,
      active: conv.id === id
    })));
    setActiveConversationId(id);
    setSidebarOpen(false);
  };

  const handleNewConversation = () => {
    // Check if user is at the limit and not in unlimited mode
    if (conversations.length >= 1) {
      toast({
        title: "Free Plan Limit Reached",
        description: "Upgrade to create more than 1 sandbox. Use the Upgrade button to see plan options.",
        variant: "destructive",
      });
      return;
    }
    
    const newId = (Math.max(...conversations.map(c => parseInt(c.id))) + 1).toString();
    const newConversation = {
      id: newId,
      title: `New Sandbox ${newId}`,
      active: true
    };
    
    setConversations([
      ...conversations.map(conv => ({...conv, active: false})),
      newConversation
    ]);
    
    setActiveConversationId(newId);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = (id: string) => {
    // Prevent deleting the last conversation
    if (conversations.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You need to have at least one sandbox.",
        variant: "destructive",
      });
      return;
    }

    const filteredConversations = conversations.filter(conv => conv.id !== id);
    setConversations(filteredConversations);

    // If we deleted the active conversation, set the first one as active
    if (id === activeConversationId) {
      const newActiveId = filteredConversations[0].id;
      setActiveConversationId(newActiveId);
      setConversations(filteredConversations.map(conv => ({
        ...conv,
        active: conv.id === newActiveId
      })));
    } else {
      setConversations(filteredConversations);
    }

    toast({
      title: "Sandbox deleted",
      description: "Your sandbox has been successfully deleted.",
    });
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations(conversations.map(conv => {
      if (conv.id === id) {
        return { ...conv, title: newTitle };
      }
      return conv;
    }));
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
  
  const isUnlimitedUser = profile?.tier === 'unlimited';

  // If no user is logged in and not a temp user, redirect to auth
  useEffect(() => {
    if (!isLoading && !user && !tempUser) {
      navigate('/auth');
    }
  }, [user, tempUser, isLoading, navigate]);

  if (isLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    // Existing JSX with added support for temp users
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
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
      />
      
      <div className="flex flex-1 flex-col md:ml-[280px]">
        <Header 
          toggleSidebar={toggleSidebar} 
          activeConversationTitle={conversations.find(conv => conv.active)?.title || null} 
        />
        <main className="flex-1 overflow-hidden">
          <ChatInterface 
            activeConversationId={activeConversationId} 
            isUnlimitedMode={isUnlimitedUser}
            onSendMessage={incrementMessageCount}
            messageCount={messageCount}
            messageLimitReached={
              // Limit applies to both temp and registered free users
              !isUnlimitedUser && messageCount >= FREE_MESSAGE_LIMIT
            }
          />
        </main>
      </div>
    </div>
  );
};

export default Index;
