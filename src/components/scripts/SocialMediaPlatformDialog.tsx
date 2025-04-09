
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

export interface SocialMediaPlatform {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SocialMediaPlatformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (platform: SocialMediaPlatform) => void;
}

const platforms: SocialMediaPlatform[] = [
  { key: 'meta', label: 'Meta (Instagram/Facebook)' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'twitter', label: 'Twitter/X' },
];

const SocialMediaPlatformDialog: React.FC<SocialMediaPlatformDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wybierz platformę</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {platforms.map((platform) => (
            <Button
              key={platform.key}
              variant="outline"
              className="justify-start text-left font-normal h-auto py-3"
              onClick={() => {
                onSelect(platform);
                onOpenChange(false);
              }}
            >
              {platform.icon && <span className="mr-2">{platform.icon}</span>}
              {platform.label}
            </Button>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <Button 
            variant="default" 
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => {
              onSelect(platforms[0]);
              onOpenChange(false);
            }}
          >
            Wybierz platformę
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialMediaPlatformDialog;
