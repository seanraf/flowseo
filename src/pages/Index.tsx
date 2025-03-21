
import React, { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';

const SAMPLE_CONVERSATIONS = [
  { id: '1', title: 'SEO Strategy for E-commerce', active: true },
  { id: '2', title: 'Blog Content Ideas', active: false },
  { id: '3', title: 'Keyword Research for SaaS', active: false },
  { id: '4', title: 'Content Optimization', active: false },
  { id: '5', title: 'Meta Descriptions Help', active: false },
];

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState(SAMPLE_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState('1');

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
      title: `New Conversation ${newId}`,
      active: true
    };
    
    setConversations([
      ...conversations.map(conv => ({...conv, active: false})),
      newConversation
    ]);
    
    setActiveConversationId(newId);
    setSidebarOpen(false);
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
