
import React from 'react';

const AttributionLogo: React.FC = () => {
  return (
    <a 
      href="http://www.33d.co/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex flex-row items-center justify-center w-full h-full"
    >
      <span className="text-sm font-medium text-gray-300 mr-3">
        Presented by
      </span>
      <div className="h-10">
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
