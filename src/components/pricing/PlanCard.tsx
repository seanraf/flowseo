
import React from 'react';
import { Button } from '@/components/ui/button';
import FeatureListItem from './FeatureListItem';

interface PlanCardProps {
  title: string;
  price: number;
  description: string;
  features: Array<{
    name: string;
    available: boolean;
    note?: string;
  }>;
  popular?: boolean;
  onSubscribe: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  title,
  price,
  description,
  features,
  popular = false,
  onSubscribe,
}) => {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow relative overflow-hidden flex flex-col">
      {popular && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl">
          POPULAR
        </div>
      )}
      <div className="flex flex-col p-6 space-y-4 flex-1">
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="text-3xl font-bold">${price} <span className="text-sm font-normal text-muted-foreground">/month</span></div>
        <p className="text-sm text-muted-foreground">{description}</p>
        
        <div className="space-y-2 flex-1">
          {features.map((feature, index) => (
            <FeatureListItem
              key={index}
              feature={feature.name}
              available={feature.available}
              note={feature.note}
            />
          ))}
        </div>
      </div>
      
      <div className="p-6 pt-0 mt-auto">
        <Button 
          className="w-full" 
          variant={popular ? "default" : "outline"}
          onClick={onSubscribe}
        >
          Subscribe
        </Button>
      </div>
    </div>
  );
};

export default PlanCard;
