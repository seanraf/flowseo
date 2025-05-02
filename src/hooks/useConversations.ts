
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface Conversation {
  id: string;
  title: string;
  active: boolean;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: '1', title: 'New Sandbox', active: true },
  ]);
  const [activeConversationId, setActiveConversationId] = useState('1');
  const { toast } = useToast();

  const handleSelectConversation = (id: string) => {
    setConversations(conversations.map(conv => ({
      ...conv,
      active: conv.id === id
    })));
    setActiveConversationId(id);
  };

  const handleNewConversation = (isUnlimitedUser: boolean) => {
    // Check if user is at the limit and not in unlimited mode
    if (!isUnlimitedUser && conversations.length >= 1) {
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

  return {
    conversations,
    activeConversationId,
    activeConversation: conversations.find(conv => conv.active),
    handleSelectConversation,
    handleNewConversation,
    handleDeleteConversation,
    handleRenameConversation
  };
};
