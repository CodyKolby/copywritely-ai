
import React, { useState } from 'react';
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
        className="max-w-[700px] max-h-[80vh] overflow-hidden bg-white rounded-lg border-0 flex flex-col"
        aria-describedby={contentId}
        id={dialogId}
      >
        <div className="border-b border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Wygenerowany post dla {platform?.label || 'mediów społecznościowych'}
            </DialogTitle>
            <DialogClose className="rounded-full p-1 hover:bg-gray-100 transition-colors">
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
              <ScriptDisplay 
                script={postContent || ''}
              />
            </div>
            
            <div className="border-t border-gray-200 p-4 flex justify-between items-center mt-auto">
              <Button
                onClick={handleCopyToClipboard}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-2"
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
              
              <div className="flex gap-2">
                {currentHookIndex + 1 < totalHooks && (
                  <Button
                    onClick={handleGenerateWithNextHook}
                    variant="outline"
                    disabled={isGeneratingNewScript}
                    className="border-copywrite-teal text-copywrite-teal"
                  >
                    Generuj inny
                  </Button>
                )}
                
                {projectSaved && projectId && (
                  <Button onClick={handleViewProject} className="bg-copywrite-teal text-white hover:bg-copywrite-teal-dark">
                    Edytuj w projektach
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratedSocialDialog;
