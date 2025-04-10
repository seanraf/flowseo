
import React, { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([
    { id: '1', title: 'New Sandbox', active: true },
  ]);
  const [activeConversationId, setActiveConversationId] = useState('1');
  const { toast } = useToast();

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
      />
      
      {/* Main content */}
      <div className="flex flex-1 flex-col md:ml-[280px]">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-hidden">
          <ChatInterface activeConversationId={activeConversationId} />
        </main>
      </div>
    </div>
  );
};

export default Index;
