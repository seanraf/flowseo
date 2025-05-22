
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Plus, MessageSquare, Search, Trash2, Check, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Logo from '@/components/Logo';
import AttributionLogo from '@/components/AttributionLogo';

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
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  conversations, 
  onSelectConversation, 
  onNewConversation,
  onDeleteConversation,
  onRenameConversation
}) => {
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRenameClick = (id: string, title: string) => {
    setEditingConversationId(id);
    setNewTitle(title);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };

  const handleRenameSubmit = (id: string) => {
    if (newTitle.trim() !== '') {
      onRenameConversation(id, newTitle);
      setEditingConversationId(null);
      setNewTitle('');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation =>
      conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  return (
    <div 
      className={`fixed inset-y-0 left-0 z-20 w-[280px] border-r border-border/50 bg-sidebar transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
    >
      <div className="flex h-16 items-center border-b border-border/50 px-4 py-4">
        <Logo />
      </div>
      
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full rounded-md border border-border/50 bg-background/50 py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            onChange={handleSearchChange}
          />
        </div>
      </div>
      
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-1 p-2">
          {filteredConversations.map((conversation) => (
            <div 
              key={conversation.id}
              className="relative group"
            >
              {editingConversationId === conversation.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={newTitle}
                    onChange={handleTitleChange}
                    className="w-full rounded-md border border-border/50 bg-background/50 py-2 pl-4 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRenameSubmit(conversation.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
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
              )}
              
              {editingConversationId !== conversation.id && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                    onClick={() => handleRenameClick(conversation.id, conversation.title)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the "{conversation.title}" sandbox and all its data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => onDeleteConversation(conversation.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="absolute bottom-28 left-0 right-0 flex justify-center">
        <Button 
          onClick={onNewConversation}
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full shadow-md border border-border/50 bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground"
        >
          <Plus className="h-5 w-5" />
          <span className="sr-only">New Sandbox</span>
        </Button>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full p-4 border-t border-border/50">
        <div className="flex justify-center">
          <AttributionLogo />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
