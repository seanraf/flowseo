
import React from 'react';

const AttributionLogo: React.FC = () => {
  return (
    <a 
      href="http://www.33d.co/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-4 left-4 flex items-center gap-2 bg-white dark:bg-gray-800 py-2 px-3 rounded-lg shadow-md hover:shadow-lg transition-all z-50"
    >
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Presented by
      </span>
      <div className="h-7">
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
