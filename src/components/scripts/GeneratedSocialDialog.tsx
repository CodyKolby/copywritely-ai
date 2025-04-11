
import React, { useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { useScriptGeneration } from './generated-script-dialog/useScriptGeneration';
import { useAuth } from '@/contexts/auth/AuthContext';
import LoadingState from './generated-script-dialog/LoadingState';
import ScriptDisplay from './generated-script-dialog/ScriptDisplay';
import ErrorState from './generated-script-dialog/ErrorState';
import ActionButtons from './generated-script-dialog/ActionButtons';
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
  const [copied, setCopied] = React.useState(false);
  
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
        className="max-w-[700px] p-0 overflow-hidden bg-white max-h-[85vh] rounded-2xl shadow-lg border-0"
        aria-describedby={contentId}
        id={dialogId}
      >
        <DialogTitle className="p-6 text-lg font-semibold text-gray-800">
          Wygenerowany post dla {platform?.label || 'mediów społecznościowych'}
        </DialogTitle>
        
        <DialogClose className="absolute right-4 top-4 rounded-full p-2 bg-gray-100 hover:bg-gray-200 transition-colors">
          <X className="h-4 w-4 text-gray-700" />
          <span className="sr-only">Zamknij</span>
        </DialogClose>
        
        {showLoading ? (
          <LoadingState stage="script" />
        ) : error ? (
          <ErrorState error={error} onRetry={handleRetry} />
        ) : (
          <>
            <div id={contentId} className="px-6 pb-6 pt-0">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <ScriptDisplay 
                  script={postContent || ''}
                  bestHook={currentHook}
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center p-6 pt-0">
              <Button
                onClick={handleCopyToClipboard}
                variant="outline"
                className="border-copywrite-teal text-copywrite-teal hover:bg-copywrite-teal hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Skopiowano
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Kopiuj do schowka
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
