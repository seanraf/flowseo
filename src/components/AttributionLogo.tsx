
import React from 'react';

const AttributionLogo: React.FC = () => {
  return (
    <a 
      href="http://www.33d.co/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex flex-col items-center justify-center w-full h-full"
    >
      <span className="text-sm font-medium text-gray-300 mb-2">
        Presented by
      </span>
      <div className="h-12">
        <img 
          src="/lovable-uploads/b77a1fa3-c631-4a56-9883-08d80d5ec0eb.png" 
          alt="33 Digital Logo" 
          className="h-full"
        />
      </div>
    </a>
  );
};

export default AttributionLogo;
