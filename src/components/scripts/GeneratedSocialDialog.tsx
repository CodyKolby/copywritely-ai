
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { useScriptGeneration } from './generated-script-dialog/useScriptGeneration';
import { useAuth } from '@/contexts/auth/AuthContext';
import LoadingState from './generated-script-dialog/LoadingState';
import ScriptDisplay from './generated-script-dialog/ScriptDisplay';
import ErrorState from './generated-script-dialog/ErrorState';
import { SocialMediaPlatform } from './SocialMediaPlatformDialog';
import { X } from 'lucide-react';
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
  
  // Use the script generation hook
  const {
    isLoading,
    generatedScript,
    postContent,
    currentHook,
    currentHookIndex,
    totalHooks,
    error,
    isGeneratingNewScript,
    isSaving,
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
        
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (err) {
        toast.error('Nie udało się skopiować do schowka');
      }
    }
  };
  
  // Log the script generation state
  React.useEffect(() => {
    if (open) {
      console.log("Social post generation dialog state:", {
        isLoading,
        templateId,
        platform: platform?.label || 'unknown',
        advertisingGoal,
        error: error ? true : false,
        isGeneratingNewScript,
        projectSaved
      });
    }
  }, [open, isLoading, templateId, platform, advertisingGoal, error, isGeneratingNewScript, projectSaved]);

  // Generate a stable key for the dialog
  const dialogKey = `${templateId}-${targetAudienceId}-${platform?.key || 'unknown'}-${open ? 'open' : 'closed'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} key={dialogKey}>
      <DialogContent 
        className="max-w-[700px] max-h-[80vh] overflow-hidden bg-white rounded-3xl border-0 flex flex-col shadow-none p-0"
        aria-describedby={contentId}
        id={dialogId}
      >
        <div className="p-8 pb-4 relative">
          <h2 className="text-2xl font-bold text-gray-900 pr-8">
            Wygenerowany post dla {platform?.label || 'mediów społecznościowych'}
          </h2>
          
          <DialogClose className="absolute right-8 top-8 rounded-full p-1 hover:bg-gray-100 transition-colors">
            <X className="h-6 w-6 text-gray-500" />
            <span className="sr-only">Zamknij</span>
          </DialogClose>
        </div>
        
        {showLoading ? (
          <LoadingState stage="script" />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : (
          <>
            <div 
              id={contentId} 
              className="px-8 flex-grow"
            >
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 overflow-y-auto mb-4">
                <ScriptDisplay script={postContent || ''} />
              </div>
            </div>
            
            <div className="p-8 pt-4 flex justify-end">
              <Button
                onClick={handleCopyToClipboard}
                className="bg-[#0D3F40] hover:bg-[#062727] text-white text-base font-medium py-3 px-8 rounded-xl"
              >
                {copied ? 'Skopiowano' : 'Kopiuj'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedSocialDialog;
