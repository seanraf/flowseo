
import React from 'react';
import { Button } from '@/components/ui/button';
import { PricingModal } from './PricingModal';

interface ChatHeaderProps {
  isUnlimitedMode: boolean;
  messageCount: number;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ isUnlimitedMode, messageCount }) => {
  if (isUnlimitedMode) return null;
  
  return (
    <div className="bg-muted/50 px-4 py-2 border-b flex justify-between items-center">
      <div className="text-sm">
        <span className="font-semibold">{messageCount}</span> of <span className="font-semibold">10</span> free messages used
      </div>
      <div className="flex items-center gap-2">
        <PricingModal>
          <Button variant="default">Upgrade Now</Button>
        </PricingModal>
      </div>
    </div>
  );
};

export default ChatHeader;
