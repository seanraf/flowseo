
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquarePlus, Plus, MessageSquare, Search, Trash2 } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  active: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  conversations, 
  onSelectConversation, 
  onNewConversation 
}) => {
  return (
    <div 
      className={`fixed inset-y-0 left-0 z-20 w-[280px] border-r border-border/50 bg-sidebar transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
    >
      <div className="flex h-16 items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5 text-primary" />
          <span className="text-lg font-medium">Chats</span>
        </div>
      </div>
      
      <div className="p-4">
        <Button 
          onClick={onNewConversation}
          className="w-full justify-start gap-2 bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <Separator className="mx-4 bg-border/50" />
      
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full rounded-md border border-border/50 bg-background/50 py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-180px)]">
        <div className="space-y-1 p-2">
          {conversations.map((conversation) => (
            <Button
              key={conversation.id}
              variant={conversation.active ? "secondary" : "ghost"}
              className={`w-full justify-start px-2 py-6 text-left transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                conversation.active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="truncate text-sm">{conversation.title}</span>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear All Conversations
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
