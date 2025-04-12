import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useScriptGeneration } from './generated-script-dialog/useScriptGeneration';
import { useAuth } from '@/contexts/auth/AuthContext';
import LoadingState from './generated-script-dialog/LoadingState';
import ScriptDisplay from './generated-script-dialog/ScriptDisplay';
import ErrorState from './generated-script-dialog/ErrorState';
import { SocialMediaPlatform } from './SocialMediaPlatformDialog';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface GeneratedSocialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal: string;
  platform?: SocialMediaPlatform;
}

const GeneratedSocialDialog: React.FC<GeneratedSocialDialogProps> = ({
  open,
  onOpenChange,
  targetAudienceId,
  templateId,
  advertisingGoal,
  platform,
}) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const {
    isLoading,
    generatedScript,
    postContent,
    currentHookIndex,
    totalHooks,
    error,
    isGeneratingNewScript,
    projectSaved,
    projectId,
    handleRetry,
    handleGenerateWithNextHook,
    handleViewProject,
  } = useScriptGeneration(open, targetAudienceId, templateId, advertisingGoal, user?.id, platform);

  const showLoading = isLoading || isGeneratingNewScript;
  const dialogId = 'social-dialog';
  const contentId = 'social-content';

  const handleCopyToClipboard = async () => {
    if (postContent) {
      try {
        await navigator.clipboard.writeText(postContent);
        setCopied(true);
        toast.success('Skopiowano do schowka');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error('Nie udało się skopiować do schowka');
      }
    }
  };

  useEffect(() => {
    if (open) {
      console.log("Social post generation dialog state:", {
        isLoading,
        templateId,
        platform: platform?.label || 'unknown',
        advertisingGoal,
        error: !!error,
        isGeneratingNewScript,
        projectSaved
      });
    }
  }, [open, isLoading, templateId, platform, advertisingGoal, error, isGeneratingNewScript, projectSaved]);

  const dialogKey = `${templateId}-${targetAudienceId}-${platform?.key || 'unknown'}-${open ? 'open' : 'closed'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
      <DialogContent 
        className="max-w-[700px] max-h-[80vh] overflow-hidden bg-white rounded-2xl shadow-xl border-0 p-0 relative"
        aria-describedby={contentId}
        id={dialogId}
      >
        <div className="p-6 border-b border-gray-100 bg-[#f8faf9] rounded-t-2xl">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold text-[#2A5C56]">
              Wygenerowany post dla {platform?.label || 'mediów społecznościowych'}
            </DialogTitle>
            <DialogClose className="rounded-full p-1 hover:bg-gray-200 transition-colors">
              <X className="h-5 w-5 text-gray-500" />
              <span className="sr-only">Zamknij</span>
            </DialogClose>
          </div>
        </div>

        {showLoading ? (
          <LoadingState stage="script" />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : (
          <>
            <div id={contentId} className="p-6 overflow-y-auto flex-grow">
              <div className="bg-gray-50 rounded-xl p-4 text-gray-800 leading-relaxed whitespace-pre-line">
                <ScriptDisplay script={postContent || ''} />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-[#f8faf9] rounded-b-2xl flex justify-end">
              <Button
                onClick={handleCopyToClipboard}
                className="bg-[#2A5C56] hover:bg-[#244b47] text-white transition-colors flex items-center gap-2 rounded-full px-5 py-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Skopiowano</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Kopiuj do schowka</span>
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedSocialDialog;