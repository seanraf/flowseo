
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const iconSizeMap = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };
  
  return (
    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <TrendingUp className={`${iconSizeMap[size]} text-primary`} />
      {showText && (
        <span className={`${textSizeMap[size]} font-medium tracking-tight`}>
          FlowSEO
        </span>
      )}
    </Link>
  );
};

export default Logo;
