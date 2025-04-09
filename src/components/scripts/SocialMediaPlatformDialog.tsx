
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export type SocialMediaPlatform = {
  key: string;
  label: string;
  description: string;
  icon?: React.ReactNode;
};

const platforms: SocialMediaPlatform[] = [
  {
    key: 'meta',
    label: 'Meta',
    description: 'Facebook i Instagram - idealny do budowania społeczności i relacji z klientami.',
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    description: 'Platforma do krótkich, dynamicznych treści wideo skierowanych do młodszej grupy odbiorców.'
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    description: 'Profesjonalna sieć społecznościowa, idealna do komunikacji B2B i budowania autorytetu w branży.'
  }
];

interface SocialMediaPlatformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (platform: SocialMediaPlatform) => void;
  onBack?: () => void;
  onCancel?: () => void;
  isProcessing?: boolean;
}

const SocialMediaPlatformDialog = ({
  open,
  onOpenChange,
  onSubmit,
  onBack,
  onCancel,
  isProcessing = false
}: SocialMediaPlatformDialogProps) => {
  const [selectedTab, setSelectedTab] = useState('meta');
  
  const handleSelection = () => {
    const platform = platforms.find(p => p.key === selectedTab);
    if (platform && onSubmit) {
      onSubmit(platform);
    } else {
      onOpenChange(false);
    }
  };
  
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onOpenChange(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Wybierz platformę społecznościową
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="meta" value={selectedTab} onValueChange={setSelectedTab} className="pt-2">
          <TabsList className="grid grid-cols-3 gap-2 w-full">
            <TabsTrigger value="meta">Meta</TabsTrigger>
            <TabsTrigger value="tiktok">TikTok</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          </TabsList>
          
          {platforms.map((platform) => (
            <TabsContent 
              key={platform.key} 
              value={platform.key}
              className="space-y-4 py-4"
            >
              <div className="space-y-2">
                <h3 className="font-medium text-lg">{platform.label}</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {platform.description}
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <div className="flex justify-end gap-2 pt-4">
          {onBack && (
            <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
              Wstecz
            </Button>
          )}
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Anuluj
          </Button>
          <Button onClick={handleSelection} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Przetwarzanie...
              </>
            ) : (
              'Wybierz platformę'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialMediaPlatformDialog;
