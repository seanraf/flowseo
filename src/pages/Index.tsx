
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import { useToast } from '@/components/ui/use-toast';
import { useLocation } from 'react-router-dom';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([
    { id: '1', title: 'New Sandbox', active: true },
  ]);
  const [activeConversationId, setActiveConversationId] = useState('1');
  const { toast } = useToast();
  const location = useLocation();
  
  // Check if we're in unlimited test mode
  const [isUnlimitedMode, setIsUnlimitedMode] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const FREE_MESSAGE_LIMIT = 10;

  useEffect(() => {
    // Check if the URL has ?unlimited=true parameter
    const searchParams = new URLSearchParams(location.search);
    const unlimited = searchParams.get('unlimited') === 'true';
    setIsUnlimitedMode(unlimited);
    
    // If in unlimited mode, show a toast notification
    if (unlimited) {
      toast({
        title: "Unlimited Testing Mode",
        description: "You're currently testing the unlimited version with no restrictions.",
      });
    }
  }, [location.search, toast]);

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
    if (conversations.length >= 1 && !isUnlimitedMode) {
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
    if (!isUnlimitedMode) {
      setMessageCount(prevCount => prevCount + 1);
      
      // Check if user has reached the message limit
      if (messageCount + 1 >= FREE_MESSAGE_LIMIT) {
        toast({
          title: "Free Plan Message Limit Reached",
          description: "You've reached the 10 message limit for the free plan. Upgrade to continue chatting.",
          variant: "destructive",
        });
      }
    }
  };

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
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
      />
      
      {/* Main content */}
      <div className="flex flex-1 flex-col md:ml-[280px]">
        <Header toggleSidebar={toggleSidebar} activeConversationTitle={conversations.find(conv => conv.active)?.title || null} />
        <main className="flex-1 overflow-hidden">
          <ChatInterface 
            activeConversationId={activeConversationId} 
            isUnlimitedMode={isUnlimitedMode}
            onSendMessage={incrementMessageCount}
            messageCount={messageCount}
            messageLimitReached={!isUnlimitedMode && messageCount >= FREE_MESSAGE_LIMIT}
          />
        </main>
      </div>
    </div>
  );
};

export default Index;
