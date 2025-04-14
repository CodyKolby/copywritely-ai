
import React from 'react';
import GeneratedScriptDialog from '../../GeneratedScriptDialog';
import GeneratedEmailDialog from '../../GeneratedEmailDialog';
import GeneratedSocialDialog from '../../GeneratedSocialDialog';
import { EmailStyle } from '../../EmailStyleDialog';
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

interface ResultDialogsProps {
  templateId: string;
  showScriptDialog: boolean;
  showEmailDialog: boolean;
  showSocialDialog: boolean;
  selectedAudienceId: string | null;
  advertisingGoal: string;
  emailStyle: EmailStyle;
  socialMediaPlatform: SocialMediaPlatform | undefined;
  handleScriptDialogClose: () => void;
  handleEmailDialogClose: () => void;
  handleSocialDialogClose: () => void;
}

const ResultDialogs = ({
  templateId,
  showScriptDialog,
  showEmailDialog,
  showSocialDialog,
  selectedAudienceId,
  advertisingGoal,
  emailStyle,
  socialMediaPlatform,
  handleScriptDialogClose,
  handleEmailDialogClose,
  handleSocialDialogClose,
}: ResultDialogsProps) => {
  return (
    <>
      {/* Script Dialog - shown for ad templates */}
      {templateId === 'ad' && (
        <GeneratedScriptDialog
          open={showScriptDialog}
          onOpenChange={handleScriptDialogClose}
          targetAudienceId={selectedAudienceId || ''}
          templateId={templateId}
          advertisingGoal={advertisingGoal}
        />
      )}

      {/* Email Dialog - shown only for email template */}
      {templateId === 'email' && (
        <GeneratedEmailDialog
          open={showEmailDialog}
          onOpenChange={handleEmailDialogClose}
          targetAudienceId={selectedAudienceId || ''}
          templateId={templateId}
          advertisingGoal={advertisingGoal}
          emailStyle={emailStyle}
        />
      )}
      
      {/* Social Dialog - shown only for social template */}
      {templateId === 'social' && (
        <GeneratedSocialDialog
          open={showSocialDialog}
          onOpenChange={handleSocialDialogClose}
          targetAudienceId={selectedAudienceId || ''}
          templateId={templateId}
          advertisingGoal={advertisingGoal}
          platform={socialMediaPlatform}
        />
      )}
    </>
  );
};

export default ResultDialogs;
