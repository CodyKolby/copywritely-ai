
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface SocialDisplayProps {
  platform: string;
  content: string;
  finalIntro?: string;
}

const SocialDisplay: React.FC<SocialDisplayProps> = ({
  platform,
  content,
  finalIntro
}) => {
  // Function to format content with proper line breaks
  const formatContent = (text: string) => {
    if (!text) return '';
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Get platform icon
  const getPlatformIcon = () => {
    switch (platform.toLowerCase()) {
      case 'instagram':
      case 'meta (instagram)':
        return '📸';
      case 'facebook':
      case 'meta (facebook)':
        return '👍';
      case 'linkedin':
        return '💼';
      case 'twitter':
      case 'x (twitter)':
        return '🐦';
      case 'tiktok':
        return '🎵';
      default:
        return '📱';
    }
  };

  // Highlight the intro part in the content if we can find it
  const highlightIntro = (content: string, intro?: string) => {
    if (!intro || !content.includes(intro)) {
      return formatContent(content);
    }

    const parts = content.split(intro);
    if (parts.length === 1) {
      return formatContent(content);
    }

    return (
      <>
        {formatContent(parts[0])}
        <span className="font-medium text-primary">{formatContent(intro)}</span>
        {formatContent(parts.slice(1).join(intro))}
      </>
    );
  };

  return (
    <div className="py-6 px-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <span>{getPlatformIcon()}</span>
          <span>Post dla platformy: <span className="font-medium">{platform}</span></span>
        </div>
      </div>
      
      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        <CardContent className="p-6 prose prose-sm max-w-none">
          {finalIntro ? (
            highlightIntro(content, finalIntro)
          ) : (
            formatContent(content)
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialDisplay;
