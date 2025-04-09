
import React from 'react';
import { Card } from '@/components/ui/card';

interface SocialDisplayProps {
  platform?: string;
  content: string;
  selectedHook: string;
  hookIndex: number;
  totalHooks: number;
  theme?: string;
  form?: string;
}

const SocialDisplay = ({ 
  platform = 'Meta', 
  content, 
  selectedHook,
  hookIndex,
  totalHooks,
  theme,
  form
}: SocialDisplayProps) => {
  return (
    <div className="p-6 max-h-[calc(90vh-150px)] overflow-y-auto">
      <div className="space-y-6">
        {/* Platform badge */}
        <div className="flex items-center justify-between">
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {platform}
          </span>
          <span className="text-xs text-gray-500">
            {theme && `${theme} • `}{form || 'Post tekstowy'}
          </span>
        </div>
        
        {/* Hook display */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Hook {hookIndex + 1}/{totalHooks}
            </h3>
          </div>
          <p className="text-lg font-medium text-gray-800">{selectedHook}</p>
        </div>
        
        {/* Content display */}
        <Card className="bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Treść posta:</h3>
          <div className="whitespace-pre-wrap text-gray-800">
            {content}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SocialDisplay;
