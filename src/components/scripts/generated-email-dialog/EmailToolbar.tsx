
import React from 'react';

const EmailToolbar = () => {
  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-2">
      {/* Basic text formatting toolbar - can be expanded with actual functionality in the future */}
      <button className="p-1 hover:bg-gray-100 rounded">
        <span className="font-bold">B</span>
      </button>
      <button className="p-1 hover:bg-gray-100 rounded">
        <span className="italic">I</span>
      </button>
      <button className="p-1 hover:bg-gray-100 rounded">
        <span className="underline">U</span>
      </button>
      <div className="h-5 w-px bg-gray-300 mx-1"></div>
      <button className="p-1 hover:bg-gray-100 rounded">
        <span>Link</span>
      </button>
    </div>
  );
};

export default EmailToolbar;
