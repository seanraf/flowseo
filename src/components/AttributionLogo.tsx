
import React from 'react';

const AttributionLogo: React.FC = () => {
  return (
    <a 
      href="http://www.33d.co/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-gray-900 dark:bg-gray-800 py-3 px-4 rounded-lg w-full"
    >
      <span className="text-sm font-medium text-gray-300 dark:text-gray-300">
        Presented by
      </span>
      <div className="h-9">
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
