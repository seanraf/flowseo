
import React from 'react';
import { Check, X } from 'lucide-react';

interface FeatureItemProps {
  feature: string;
  available: boolean;
  note?: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ feature, available, note }) => (
  <div className="flex items-center">
    {available ? (
      <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
    )}
    <span className={`text-sm ${available ? '' : 'text-muted-foreground'}`}>
      {feature} {note && <span className="text-xs text-muted-foreground">{note}</span>}
    </span>
  </div>
);

export default FeatureItem;
