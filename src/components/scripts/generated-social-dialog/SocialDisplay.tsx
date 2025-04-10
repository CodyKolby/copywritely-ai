
import React from 'react';
import { Card } from '@/components/ui/card';

interface SocialDisplayProps {
  platform?: string;
  content: string;
  theme?: string;
  form?: string;
}

const SocialDisplay = ({ 
  platform = 'Meta', 
  content, 
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
        
        {/* Content display */}
        <Card className="bg-white p-6">
          <div className="whitespace-pre-wrap text-gray-800">
            {content}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SocialDisplay;
