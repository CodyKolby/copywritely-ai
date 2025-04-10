
import React from 'react';
import { X } from 'lucide-react';

const DialogHeader = () => {
  return (
    <div className="flex justify-between items-center border-b border-gray-200 p-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Wygenerowany post
      </h2>
      
      <div className="flex items-center space-x-2">
        <X className="h-4 w-4 text-gray-500" />
      </div>
    </div>
  );
};

export default DialogHeader;
