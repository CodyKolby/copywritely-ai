
import React, { useState } from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Facebook, Instagram, Linkedin, MessageSquare } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export type SocialMediaPlatform = 'meta' | 'tiktok' | 'linkedin';

interface SocialMediaPlatformDialogProps {
  onSubmit: (platform: SocialMediaPlatform) => void;
  onBack: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const SocialMediaPlatformDialog = ({
  onSubmit,
  onBack,
  onCancel,
  isProcessing = false
}: SocialMediaPlatformDialogProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialMediaPlatform | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlatform) {
      onSubmit(selectedPlatform);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">Wybierz platformę social media</DialogTitle>
        <DialogDescription>
          Wskaż platformę, na której będzie publikowany Twój post
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        <RadioGroup
          value={selectedPlatform || ""}
          onValueChange={(value) => setSelectedPlatform(value as SocialMediaPlatform)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="meta" id="meta" />
            <Label htmlFor="meta" className="flex items-center gap-2 cursor-pointer">
              <div className="flex gap-2 items-center">
                <Facebook className="h-5 w-5 text-blue-600" />
                <Instagram className="h-5 w-5 text-pink-600" />
              </div>
              <span>Meta (Instagram & Facebook)</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="tiktok" id="tiktok" />
            <Label htmlFor="tiktok" className="flex items-center gap-2 cursor-pointer">
              <MessageSquare className="h-5 w-5 text-black" />
              <span>TikTok</span>
            </Label>
          </div>

          <div className="flex items-center space-x-2 rounded-md border p-4 cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="linkedin" id="linkedin" />
            <Label htmlFor="linkedin" className="flex items-center gap-2 cursor-pointer">
              <Linkedin className="h-5 w-5 text-blue-700" />
              <span>LinkedIn</span>
            </Label>
          </div>
        </RadioGroup>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isProcessing}
          >
            Wstecz
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Anuluj
          </Button>
          <Button
            type="submit"
            className="bg-copywrite-teal hover:bg-copywrite-teal-dark"
            disabled={!selectedPlatform || isProcessing}
          >
            {isProcessing ? "Przetwarzanie..." : "Kontynuuj"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

export default SocialMediaPlatformDialog;
