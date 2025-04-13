
import React from 'react';
import { TargetAudienceDialogProps } from './target-audience-dialog/types';
import DialogManager from './target-audience-dialog/DialogManager';

/**
 * Main entry point for the Target Audience Dialog system
 * This component is now just a wrapper around the DialogManager
 * which handles all the complexity
 */
const TargetAudienceDialog = (props: TargetAudienceDialogProps) => {
  return <DialogManager {...props} />;
};

export default TargetAudienceDialog;
