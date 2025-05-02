
import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface FeatureItemProps {
  feature: string;
  available: boolean;
  note?: string;
}

const FeatureListItem = ({ feature, available, note }: FeatureItemProps) => (
  <div className="flex items-center">
    {available ? (
      <CheckCircle2 className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
    )}
    <span className={`text-sm ${available ? '' : 'text-muted-foreground'}`}>
      {feature} {note && <span className="text-xs text-muted-foreground">{note}</span>}
    </span>
  </div>
);

export default FeatureListItem;
