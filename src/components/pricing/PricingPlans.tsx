
import React from 'react';
import PlanCard from './PlanCard';
import AuthRequiredNotice from './AuthRequiredNotice';

interface PricingPlansProps {
  user: any;
  onSignUp: () => void;
  onSelectPlan: (plan: 'limited' | 'unlimited') => void;
}

const PricingPlans: React.FC<PricingPlansProps> = ({ user, onSignUp, onSelectPlan }) => {
  // Define features for limited plan
  const limitedFeatures = [
    { name: "Unlimited Keyword Research", available: true, note: "(with caching)" },
    { name: "15 AI-Generated Articles", available: true },
    { name: "3 Active Projects", available: true },
    { name: "Archived Projects for Data Retention", available: true },
    { name: "CSV Export of Keyword Lists", available: true },
    { name: "Basic SEO Filtering & Competitor Analysis", available: true }
  ];

  // Define features for unlimited plan
  const unlimitedFeatures = [
    { name: "Unlimited Keyword Research", available: true },
    { name: "Unlimited AI Content Generation", available: true },
    { name: "Unlimited Active Projects", available: true },
    { name: "Advanced Competitive Insights & SEO Outlines", available: true },
    { name: "Priority Support", available: true },
    { name: "CSV Export & CMS Integration", available: true }
  ];

  if (!user) {
    return <AuthRequiredNotice onSignUp={onSignUp} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
      <PlanCard
        title="Limited Plan"
        price={20}
        description="For Freelancers & Small Businesses"
        features={limitedFeatures}
        productId="prod_SBvI46y2KqRMr2"
        onSubscribe={() => onSelectPlan('limited')}
      />
      <PlanCard
        title="Unlimited Plan"
        price={99}
        description="For Agencies & Enterprises"
        features={unlimitedFeatures}
        productId="prod_SBvI4ATCgacOfn"
        popular={true}
        onSubscribe={() => onSelectPlan('unlimited')}
      />
    </div>
  );
};

export default PricingPlans;
