
import React from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export interface SocialMediaPlatform {
  key: string;
  label: string;
  description?: string;
}

export interface SocialMediaPlatformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (platform: SocialMediaPlatform) => void;
  onBack?: () => void;
  onCancel?: () => void;
  isProcessing?: boolean;
}

const platforms: SocialMediaPlatform[] = [
  { 
    key: 'meta', 
    label: 'Meta (Instagram/Facebook)',
    description: 'Idealne dla wizualnych treści, historii i budowania społeczności wokół marki.'
  },
  { 
    key: 'tiktok', 
    label: 'TikTok',
    description: 'Doskonałe dla krótkich, dynamicznych treści video skierowanych do młodszej publiczności.' 
  },
  { 
    key: 'linkedin', 
    label: 'LinkedIn',
    description: 'Najlepsze dla contentu biznesowego, profesjonalnych porad i networkingu branżowego.' 
  },
];

const SocialMediaPlatformDialog: React.FC<SocialMediaPlatformDialogProps> = ({
  open,
  onOpenChange,
  onSelect,
  onBack,
  onCancel,
  isProcessing = false
}) => {
  const [selectedPlatform, setSelectedPlatform] = React.useState<string | null>(null);

  const handleSubmit = () => {
    if (selectedPlatform) {
      const platform = platforms.find(p => p.key === selectedPlatform);
      if (platform) {
        onSelect(platform);
      }
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <DialogHeader>
        <DialogTitle className="text-2xl font-semibold">Wybierz platformę social media</DialogTitle>
        <DialogDescription>
          Wybierz, dla której platformy chcesz stworzyć post.
        </DialogDescription>
      </DialogHeader>

      <RadioGroup value={selectedPlatform || ''} onValueChange={(value) => setSelectedPlatform(value)} className="px-2">
        <div className="grid gap-4 mt-4">
          {platforms.map((platform) => (
            <Card key={platform.key} className={`p-4 cursor-pointer transition-all ${selectedPlatform === platform.key ? 'border-copywrite-teal ring-2 ring-copywrite-teal/20' : 'hover:border-gray-300'}`}>
              <div className="flex items-start space-x-3">
                <RadioGroupItem value={platform.key} id={platform.key} className="mt-1" />
                <div className="space-y-1">
                  <Label htmlFor={platform.key} className="text-lg font-medium">
                    {platform.label}
                  </Label>
                  <p className="text-sm text-gray-600">
                    {platform.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </RadioGroup>

      <DialogFooter className="flex justify-between px-2">
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
              Anuluj
            </Button>
          )}
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack} disabled={isProcessing}>
              Wstecz
            </Button>
          )}
        </div>
        <Button 
          type="button" 
          className="bg-copywrite-teal hover:bg-copywrite-teal-dark text-white"
          disabled={!selectedPlatform || isProcessing}
          onClick={handleSubmit}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Przetwarzanie...
            </>
          ) : (
            "Dalej"
          )}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default SocialMediaPlatformDialog;
